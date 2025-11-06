"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
//import { AuthRequest } from '../types/express.d';
/**
 * Middleware to protect routes by verifying a JWT tokem in the request header.
 */
const protect = async (req, res, next) => {
    let token;
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
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // Find user and Attach to request object, excluding password
            const user = (await User_1.default.findById(decoded.id).select('-password')); // Exclude password
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
        }
        catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    }
    else {
        res.status(401).json({ message: 'Not authorized, no token.' });
        return;
    }
};
exports.protect = protect;
//# sourceMappingURL=authMiddleware.js.map