"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroupChat = exports.fetchChats = exports.accessChat = void 0;
const Chat_1 = __importDefault(require("../models/Chat"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * @desc Access a chat (create if it doesn't exist)
 * @route POST /api/chats
 * @access Private
 * @body { userId: string } - ID of the user to chat with
 */
const accessChat = async (req, res) => {
    const { userId } = req.body; // The ID of the target user
    const currentUserId = req.user.id; // The ID of the logged-in user
    if (!userId) {
        //console.log('Target User ID not sent with request');
        res.status(400).json({ message: 'Target User ID required.' });
        return;
    }
    if (!currentUserId) {
        res.status(401).json({ message: 'Not authorized, user missing.' });
        return;
    }
    // Check if current user is trying to chat with themselves
    if (currentUserId.toString() === userId.toString()) {
        res.status(400).json({ message: 'Cannot start a chat with yourself.' });
        return;
    }
    try {
        // 1. Check if a private chat already exists
        let chat = await Chat_1.default.findOne({
            isGroup: false,
            // $all ensures both IDs are present in the participants array
            participants: { $all: [currentUserId, userId] },
        })
            .populate('participants', 'username email avatarUrl status') // Popultate user data
            .populate('lastMessage'); //Populate the last message object
        if (chat) {
            // Chat found, return it
            res.status(200).send(chat);
            return;
        }
        // 2. Chat not found, create a new one
        const newChatData = {
            isGroup: false,
            participants: [currentUserId, userId],
            unreadCounts: new Map([[currentUserId, 0], [userId, 0]]), // Initialize unread counts
        };
        const createdChat = await Chat_1.default.create(newChatData);
        // 3. Retrieve the fully populated chat to send back
        const fullChat = await Chat_1.default.findOne({ _id: createdChat._id })
            .populate('participants', 'username email avatarUrl status');
        // 4. Update the User documents to include the new chat ID
        await User_1.default.findByIdAndUpdate(currentUserId, { $push: { chats: createdChat._id } });
        await User_1.default.findByIdAndUpdate(userId, { $push: { chats: createdChat._id } });
        res.status(200).json(fullChat);
    }
    catch (error) {
        console.error('Error accessing/creating chat:', error);
        res.status(500).json({ message: 'Server error while accessing chat.' });
    }
};
exports.accessChat = accessChat;
/**
 * @desc Fetch all chats for the logged-in user
 * @route GET /api/chats
 * @access Private
 */
const fetchChats = async (req, res) => {
    const currentUserId = req.user.id;
    if (!currentUserId) {
        res.status(401).json({ message: 'Not authorized, user missing.' });
        return;
    }
    try {
        // Find all chats where the current user is a participant
        const chats = await Chat_1.default.find({ participants: { $elemMatch: { $eq: currentUserId } } })
            .populate('participants', 'username email avatarUrl status') // Get participant details
            .populate('lastMessage') // Get last message details
            // Sort by the most recently updated chat (usually when a new message arrives)
            .sort({ updatedAt: -1 });
        // populate the lastMessage.senderId here if needed, but keeping it simple for now
        res.status(200).send(chats);
    }
    catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Server error while fetching chats.' });
    }
};
exports.fetchChats = fetchChats;
/**
 * @desc Create a new group chat
 * @route POST /api/chats/group
 * @access Private
 * @body { name: string, users: string[] }
 */
const createGroupChat = async (req, res) => {
    const { name, users } = req.body;
    const currentUserId = req.user.id;
    if (!name || !users || users.length < 2) {
        res.status(400).json({ message: 'Group requires a name and at least 3 members (including yourself).' });
        return;
    }
    // Convert string IDs to Mongoose ObjectIds
    const participantIds = users.map((id) => new mongoose_1.default.Types.ObjectId(id));
    participantIds.push(new mongoose_1.default.Types.ObjectId(currentUserId)); // Add the creator
    try {
        const groupChat = await Chat_1.default.create({
            isGroup: true,
            name: name,
            participants: participantIds,
            // Initialize unread counts for all participants to 0
            unreadCounts: new Map(participantIds.map((id) => [id.toString(), 0])),
        });
        // Update all participant user documents to include the new chat ID
        await User_1.default.updateMany({ _id: { $in: participantIds } }, { $push: { chats: groupChat._id } });
        // Fetch the fully populated chat object to return
        const fullGroupChat = await Chat_1.default.findById(groupChat._id)
            .populate('participants', 'username email avatarUrl status');
        res.status(201).json(fullGroupChat);
    }
    catch (error) {
        console.error('Error creating group chat:', error);
        res.status(500).json({ message: 'Server error while creating group chat.' });
    }
};
exports.createGroupChat = createGroupChat;
//# sourceMappingURL=chatController.js.map