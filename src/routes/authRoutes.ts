import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController';
import passport from 'passport';
import jwt from 'jsonwebtoken'; // For token generation after social login

const router = Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);


// --- Social Auth Routes ---

// Helper function to handle the redirect after successful social auth
const socialAuthRedirect = (req: any, res: any) => {
    // Generate JWT for the authenticated user
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

    // Redirect to frontend with token/user data in URL parameters
    const redirectUrl = `${process.env.FRONTEND_URL}/social-auth-handler?token=${token}&userId=${req.user._id}`;
    res.redirect(redirectUrl);
};

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    socialAuthRedirect
);


// GitHub Auth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', 
    passport.authenticate('github', { failureRedirect: '/login' }),
    socialAuthRedirect
);


export default router;