import { Response } from 'express';
import { AuthRequest } from '../types/express.d';
/**
 * @desc Access a chat (create if it doesn't exist)
 * @route POST /api/chats
 * @access Private
 * @body { userId: string } - ID of the user to chat with
 */
export declare const accessChat: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * @desc Fetch all chats for the logged-in user
 * @route GET /api/chats
 * @access Private
 */
export declare const fetchChats: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * @desc Create a new group chat
 * @route POST /api/chats/group
 * @access Private
 * @body { name: string, users: string[] }
 */
export declare const createGroupChat: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=chatController.d.ts.map