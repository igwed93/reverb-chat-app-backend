import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User';
import { IUser } from '../types/models';
import { Document, Types } from 'mongoose';

type IUserDocument = Document<Types.ObjectId, any, IUser> & IUser;

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
                return done(new Error('No email found in Google profile'), undefined);
            }
            let user: IUserDocument | null = await User.findOne({ email });

            if (!user) {
                // Create user if they don't exist (no password needed)
                const newUser = await User.create({
                    username: profile.displayName || profile.username,
                    email: profile.emails?.[0]?.value,
                    avatarUrl: profile.photos?.[0]?.value,
                    status: 'Online',
                    chats: [],
                });
                
                user =  newUser as IUserDocument;
            } else {
                // Update user status
                user.status = 'Online';
                await user.save();
            }
            // Pass the user object to the next stage
            done(null, user);
        } catch (err) {
            done(err as Error, undefined);
        }
    }
));


// Configur GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
    scope: ['user:email']
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
       const primaryEmail = profile.emails?.[0]?.value || `${profile.username}@github-placeholder.com`;
       console.log('GitHub profile:', JSON.stringify(profile, null, 2));

       try {
        let user: IUserDocument | null = await User.findOne({ email: primaryEmail });

        if (!user) {
            user = await User.create({
                username: profile.displayName || profile.username,
                email: primaryEmail,
                avatarUrl: profile.photos?.[0].value,
                status: 'Online',
            }) as IUserDocument;
        } else {
            user.status = 'Online';
            await user.save();
        }

        done(null, user);

       } catch (err) {
        done(err, undefined);
       }
    }
));


// Passport serialization is required to link the session to the User ID
passport.serializeUser((user: any, done) => {
    done(null, user._id);
});


passport.deserializeUser(async (id: string, done) => {
    const user = await User.findById(id).select('-password');
    done(null, user);
});

export default passport;