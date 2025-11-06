"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const User_1 = __importDefault(require("../models/User"));
// Configure Google Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
        }
        let user = await User_1.default.findOne({ email });
        if (!user) {
            // Create user if they don't exist (no password needed)
            const newUser = await User_1.default.create({
                username: profile.displayName || profile.username,
                email: profile.emails?.[0]?.value,
                avatarUrl: profile.photos?.[0]?.value,
                status: 'Online',
                chats: [],
            });
            user = newUser;
        }
        else {
            // Update user status
            user.status = 'Online';
            await user.save();
        }
        // Pass the user object to the next stage
        done(null, user);
    }
    catch (err) {
        done(err, undefined);
    }
}));
// Configur GitHub Strategy
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
    scope: ['user:email']
}, async (_accessToken, _refreshToken, profile, done) => {
    const primaryEmail = profile.emails?.[0]?.value || `${profile.username}@github-placeholder.com`;
    console.log('GitHub profile:', JSON.stringify(profile, null, 2));
    try {
        let user = await User_1.default.findOne({ email: primaryEmail });
        if (!user) {
            user = await User_1.default.create({
                username: profile.displayName || profile.username,
                email: primaryEmail,
                avatarUrl: profile.photos?.[0].value,
                status: 'Online',
            });
        }
        else {
            user.status = 'Online';
            await user.save();
        }
        done(null, user);
    }
    catch (err) {
        done(err, undefined);
    }
}));
// Passport serialization is required to link the session to the User ID
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
passport_1.default.deserializeUser(async (id, done) => {
    const user = await User_1.default.findById(id).select('-password');
    done(null, user);
});
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map