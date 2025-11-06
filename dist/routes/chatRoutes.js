"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Routes for creating and fetching conversations
router.route('/').post(authMiddleware_1.protect, chatController_1.accessChat); // Access/Create a chat (Private Chat)
router.route('/').get(authMiddleware_1.protect, chatController_1.fetchChats); // Fetch all chats for the user
// Group Creation
router.route('/group').post(authMiddleware_1.protect, chatController_1.createGroupChat);
exports.default = router;
//# sourceMappingURL=chatRoutes.js.map