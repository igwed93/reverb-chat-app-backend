import { Router } from 'express';
import { sendMessage, allMessages, markMessagesAsRead } from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = Router();


// Routes that require authentication (protected)
router.route('/').post(protect, sendMessage); // POST /api/messages
router.route('/:chatId').get(protect, allMessages); // GET /api/messages/123
router.route('/read').put(protect, markMessagesAsRead);

export default router;
