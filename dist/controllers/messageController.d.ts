import { RequestHandler } from 'express';
/**
 * @desc Get all messages for a specific chat
 * @route GET /api/messages/:chatId
 * @access Private
 */
export declare const allMessages: RequestHandler;
/**
 * @desc Send a new message
 * @route POST /api/messages
 * @access Private
 * @body { chatId, content }
 */
export declare const sendMessage: RequestHandler;
/**
 * @desc Mark all messaes in a chat as read for the current user
 * @route PUT /api/messages/read
 * @access Private
 * @body { chatId }
 */
export declare const markMessagesAsRead: RequestHandler;
//# sourceMappingURL=messageController.d.ts.map