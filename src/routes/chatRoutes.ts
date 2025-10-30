import { RequestHandler, Router } from 'express';
import { accessChat, fetchChats, createGroupChat } from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

const router = Router();


// Routes for creating and fetching conversations
router.route('/').post(protect as RequestHandler, accessChat as unknown as RequestHandler) // Access/Create a chat (Private Chat)
router.route('/').get(protect as RequestHandler, fetchChats as unknown as RequestHandler); // Fetch all chats for the user

// Group Creation
router.route('/group').post(protect as RequestHandler, createGroupChat as unknown as RequestHandler);

export default router;