"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // For token generation after social login
const router = (0, express_1.Router)();
// Public Routes
router.post('/register', authController_1.registerUser);
router.post('/login', authController_1.loginUser);
// --- Social Auth Routes ---
// Helper function to handle the redirect after successful social auth
const socialAuthRedirect = (req, res) => {
    // Generate JWT for the authenticated user
    const token = jsonwebtoken_1.default.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    // Redirect to frontend with token/user data in URL parameters
    const redirectUrl = `${process.env.FRONTEND_URL}/social-auth-handler?token=${token}&userId=${req.user._id}`;
    res.redirect(redirectUrl);
};
// Google Auth
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/login' }), socialAuthRedirect);
// GitHub Auth
router.get('/github', passport_1.default.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport_1.default.authenticate('github', { failureRedirect: '/login' }), socialAuthRedirect);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map