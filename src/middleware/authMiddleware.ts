import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../types/models';
import { AuthRequest } from '../types/express.d';

/**
 * Middleware to protect routes by verifying a JWT tokem in the request header.
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in the 'Authorization' header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: 'Bearer <token>')
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                return res.status(401).json({ message: 'Not authorized, no token.' });
            }

            // Verify token
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not defined.');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

            // Find user and Attach to request object, excluding password
            const user = (await User.findById(decoded.id).select('-password')) as IUser; // Exclude password

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found.' });
            }

            // Attach user ID to request object
            req.user = {
                id: user._id.toString(),
                name: user.username,
                email: user.email,
            };

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token.' });
    }
};