import { Request, Response } from 'express';
/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export declare const registerUser: (req: Request, res: Response) => Promise<void>;
/**
 * @desc Authenticate user and get token
 * @route POST /api/auth/login
 * @access Public
 */
export declare const loginUser: (req: Request, res: Response) => Promise<void>;
/**
 * @desc Generate OTP, save to DB, and email the link/code
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export declare const forgotPassword: (req: Request, res: Response) => Promise<void>;
/**
 * @desc Verify OTP code
 * @route POST /api/auth/verify-otp
 * @access Public
 */
export declare const verifyOtp: (req: Request, res: Response) => Promise<void>;
/**
 * @desc Reset password using valid OTP/Token
 * @route POST /api/auth/reset-password
 * @access Public
 */
export declare const resetPassword: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map