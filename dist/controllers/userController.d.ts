import { Response } from 'express';
import { AuthRequest } from '../types/express.d';
/**
 * @desc Get current authenticated user profile
 * @route GET /api/users/profile
 * @access Private
 */
export declare const getUserProfile: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * @desc Search for users by username or email
 * @route GET /api/users?search=<keyword>
 * @access Private
 */
export declare const searchUsers: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * @desc Log out user (set status to Offline)
 * @route POST /api/users/logout
 * @access Private
 */
export declare const logoutUser: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * @desc Update the authenticated user's profile picture
 * @route PUT /api/users/avatar
 * @access Private
 * @body { avatarUrl: string } (Actual implementation uses multipart/form-data)
 */
export declare const updateUserAvatar: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map