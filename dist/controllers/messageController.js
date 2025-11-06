"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessagesAsRead = exports.sendMessage = exports.allMessages = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const Chat_1 = __importDefault(require("../models/Chat"));
const server_1 = require("../server");
/**
 * @desc Get all messages for a specific chat
 * @route GET /api/messages/:chatId
 * @access Private
 */
const allMessages = async (req, res) => {
    const authReq = req;
    try {
        const { chatId } = authReq.params;
        // Fetch messages for the chat, sorted by creation time
        const messages = await Message_1.default.find({ chatId })
            .populate('senderId', 'username avatarUrl email') // Get sender details
            .limit(100) // Limit to 100 messages for initial load (pagination would be added later)
            .sort({ createdAt: 1 });
        res.status(200).json(messages);
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages.' });
    }
};
exports.allMessages = allMessages;
/**
 * @desc Send a new message
 * @route POST /api/messages
 * @access Private
 * @body { chatId, content }
 */
const sendMessage = async (req, res) => {
    const authReq = req;
    const { chatId, content } = authReq.body;
    const senderId = authReq.user.id;
    if (!chatId || !content || !senderId) {
        res.status(400).json({ message: 'Invalid data passed into request.' });
        return;
    }
    const newMessage = {
        chatId,
        senderId,
        content,
        type: 'text',
        status: 'sent',
    };
    try {
        // Create and save the new message
        let message = await Message_1.default.create(newMessage);
        // Populate fields needed for real-time delivery
        message = await Message_1.default.populate(message, { path: 'senderId', select: 'username avatarUrl' });
        // Update the Chat document with the new message ID and increment the unread counts for the sender
        const chat = await Chat_1.default.findByIdAndUpdate(chatId);
        // Reset the sender's unread count to 0 (they just saw the chat)
        if (chat) {
            chat.lastMessage = message._id;
            // Logic to increment receiver's unread count
            const senderIdStr = senderId.toString();
            chat.participants.forEach(participantId => {
                const participantIdStr = participantId.toString();
                const unreadCounts = chat.unreadCounts;
                // If the participant is NOT the sender, increment their count
                if (participantIdStr !== senderIdStr) {
                    const currentCount = unreadCounts.get(participantIdStr) || 0;
                    unreadCounts.set(participantIdStr, currentCount + 1);
                }
                else {
                    // Always clear the sender's unread count when they send a message
                    unreadCounts.set(participantIdStr, 0);
                }
            });
            await chat.save();
        }
        // Send the populated message object back to the client
        res.status(201).json(message);
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message.' });
    }
};
exports.sendMessage = sendMessage;
/**
 * @desc Mark all messaes in a chat as read for the current user
 * @route PUT /api/messages/read
 * @access Private
 * @body { chatId }
 */
const markMessagesAsRead = async (req, res) => {
    const authReq = req;
    const { chatId } = authReq.body;
    const currentUserId = authReq.user.id;
    if (!chatId || !currentUserId) {
        res.status(400).json({ message: 'Chat ID required.' });
        return;
    }
    try {
        // Update Message Status: Change status from 'delivered' to 'read' for all *other* senders
        await Message_1.default.updateMany({
            chatId: chatId,
            senderId: { $ne: currentUserId }, // Only mark messagges sent by others
            status: { $in: ['sent', 'delivered'] } // Only change if not already read
        }, { $set: { status: 'read' } });
        // Clear Unread Count: Clear the count for the current user in the Chat document
        const chat = await Chat_1.default.findById(chatId);
        if (chat) {
            const unreadCounts = chat.unreadCounts;
            unreadCounts.set(currentUserId, 0);
            await chat.save();
        }
        // SOCKET.IO Broacast
        // Find the other user in the chat
        const otherParticipantId = chat?.participants
            .find(id => id.toString() !== currentUserId.toString());
        if (otherParticipantId) {
            // Emit event to the other user's personal room (ID)
            server_1.io.to(otherParticipantId.toString()).emit('messages read', chatId);
        }
        res.status(200).json({ message: 'Messages marked as read and count cleared.' });
    }
    catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error during read receipt update.' });
    }
};
exports.markMessagesAsRead = markMessagesAsRead;
//# sourceMappingURL=messageController.js.map