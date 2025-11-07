import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../types/models';
import nodemailer from 'nodemailer';

// Utility function to generate JWT
const generateToken = (id: string): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};


/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const username = req.body.username?.trim(); 
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    const confirmPassword = req.body.confirmPassword?.trim();

    if (!username || !email || !password || !confirmPassword) {
        res.status(400).json({ message: 'Please enter all fields.' });
        return;
    }

    if (password !== confirmPassword) {
        res.status(400).json({ message: 'Passwords do not match.' });
        return;
    }

    try {
        // 1. Check if user already exists
        let user: (IUser & { _id: any }) | null = await User.findOne({ email });
        if (user) {
            res.status(400).json({ message: 'User already exists.' });
            return;
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashsedPassword = await bcrypt.hash(password, salt);

        // 3. Create new user
        user = (await User.create({
            username,
            email,
            password: hashsedPassword,
            avatarUrl: '',
        })) as IUser & { _id: any };

        // 4. Respond with user data and token
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            token: generateToken(user._id.toString()),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};


/**
 * @desc Authenticate user and get token
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Please enter all fields.' });
        return;
    }

    try {
        // 1. Check for user by email
        const user = await User.findOne({ email }).select('+password') as (IUser & { _id: any });

        if (user && user.password) {
            // 2. Compare hashed password
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                // 3. Update status and respond with token
                user.status = 'Online';
                user.lastSeen = new Date();
                await user.save();

                const userResponse = user.toObject(); // Get a plain JS object
                delete userResponse.password; // Remove the property before sending

                res.json({
                    _id: userResponse._id,
                    username: userResponse.username,
                    email: userResponse.email,
                    avatarUrl: userResponse.avatarUrl,
                    token: generateToken(userResponse._id.toString()),
                });
                return;
            }
        }

        // Fallback for incorrect credentials
        res.status(401).json({ message: 'Invalid credentials.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};


// --- Configure Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});


/**
 * @desc Generate OTP, save to DB, and email the link/code
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ message: 'Email is required.' });
        return;
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // For security, return success even if user not found
            res.status(200).json({ message: 'If a user with that email exists, a password reset code has been sent.' });
            return;
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
        const expiry = Date.now() + 3600000; // 1 hour expiration

        // Save OTP and Expiry to user record (select +password to prevent hash deletion)
        user.resetPasswordToken = otp;
        user.resetPasswordExpires = new Date(expiry);
        await user.save(); 

        // Send Email
        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Reverb Password Reset Code',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n`
                  + `Your one-time password (OTP) is: ${otp}\n\n`
                  + `This code is valid for 1 hour.`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Password reset code sent to email.' });

    } catch (err) {
        console.error('Password reset error:', err);
        res.status(500).json({ message: 'Error sending reset code.' });
    }
};

/**
 * @desc Verify OTP code
 * @route POST /api/auth/verify-otp
 * @access Public
 */
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = req.body;
    
    try {
        const user = await User.findOne({ 
            email, 
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() } // Check if token is not expired
        });

        if (!user) {
            res.status(400).json({ message: 'Invalid or expired code.' });
            return;
        }

        // OTP is valid and not expired
        res.status(200).json({ message: 'Code verified successfully.' });

    } catch (err) {
        res.status(500).json({ message: 'Server error during verification.' });
    }
};

/**
 * @desc Reset password using valid OTP/Token
 * @route POST /api/auth/reset-password
 * @access Public
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { email, token, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ message: 'Password must be at least 6 characters.' });
        return;
    }

    try {
        // Find user by email and non-expired token
        const user = await User.findOne({ 
            email, 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        }).select('+password'); // CRITICAL: Select password to save the new hash

        if (!user) {
            res.status(400).json({ message: 'Invalid or expired reset link.' });
            return;
        }
        
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset tokens
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        // Save the updated password and clear the tokens (preserves the new hash)
        await user.save(); 

        res.status(200).json({ message: 'Password reset successful. You can now log in.' });

    } catch (err) {
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};