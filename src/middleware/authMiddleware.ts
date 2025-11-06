import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../types/models';
//import { AuthRequest } from '../types/express.d';

/**
 * Middleware to protect routes by verifying a JWT tokem in the request header.
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    // Check for token in the 'Authorization' header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: 'Bearer <token>')
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                res.status(401).json({ message: 'Not authorized, no token.' });
                return;
            }

            // Verify token
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not defined.');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

            // Find user and Attach to request object, excluding password
            const user = (await User.findById(decoded.id).select('-password')) as IUser; // Exclude password

            if (!user) {
                res.status(401).json({ message: 'Not authorized, user not found.' });
                return;
            }

            // Attach user ID to request object
            req.user = {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
            };

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token.' });
        return;
    }
};