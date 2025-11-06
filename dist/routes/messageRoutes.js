"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messageController_1 = require("../controllers/messageController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Routes that require authentication (protected)
router.route('/').post(authMiddleware_1.protect, messageController_1.sendMessage); // POST /api/messages
router.route('/:chatId').get(authMiddleware_1.protect, messageController_1.allMessages); // GET /api/messages/123
router.route('/read').put(authMiddleware_1.protect, messageController_1.markMessagesAsRead);
exports.default = router;
//# sourceMappingURL=messageRoutes.js.map