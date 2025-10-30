import { RequestHandler, Router } from 'express';
import { getUserProfile, searchUsers, logoutUser, updateUserAvatar } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware'

const router = Router();

// Routes that require authentication (protected)
router.route('/profile').get(protect as RequestHandler, getUserProfile as unknown as RequestHandler);
router.route('/').get(protect as RequestHandler, searchUsers as unknown as RequestHandler); // /api/users?search=...
router.route('/logout').post(protect as RequestHandler, logoutUser as unknown as RequestHandler); // POST /api/users/logout
router.route('/avatar').put(protect as RequestHandler, updateUserAvatar as unknown as RequestHandler); // PUT /api/users/avatar

export default router;