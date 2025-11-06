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
//# sourceMappingURL=authController.d.ts.map