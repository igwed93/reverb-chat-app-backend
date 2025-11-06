import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../types/models';

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

    console.log({ username: username, email: email, password: password });
    if (!username || !email || !password) {
        res.status(400).json({ message: 'Please enter all fields.' });
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
