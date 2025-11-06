import {Request, Response, RequestHandler } from 'express';
import Message from '../models/Message';
import Chat from '../models/Chat';
import { io } from '../server';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/express.d';


/**
 * @desc Get all messages for a specific chat
 * @route GET /api/messages/:chatId
 * @access Private
 */
export const allMessages: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    try {
        const { chatId } = authReq.params;

        // Fetch messages for the chat, sorted by creation time
        const messages = await Message.find({ chatId })
            .populate('senderId', 'username avatarUrl email') // Get sender details
            .limit(100) // Limit to 100 messages for initial load (pagination would be added later)
            .sort({ createdAt: 1 });

            res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages.' });
    }
};


/**
 * @desc Send a new message
 * @route POST /api/messages
 * @access Private
 * @body { chatId, content }
 */
export const sendMessage: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const { chatId, content } = authReq.body;
    const senderId = authReq.user!.id;

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
        let message = await Message.create(newMessage);

        // Populate fields needed for real-time delivery
        message = await Message.populate(message, { path: 'senderId', select: 'username avatarUrl' });

        // Update the Chat document with the new message ID and increment the unread counts for the sender
        const chat = await Chat.findByIdAndUpdate(chatId)


        // Reset the sender's unread count to 0 (they just saw the chat)
        if (chat) {
            chat.lastMessage = message._id as Types.ObjectId;
            
            // Logic to increment receiver's unread count
            const senderIdStr = senderId.toString();

            chat.participants.forEach(participantId => {
                const participantIdStr = participantId.toString();
                const unreadCounts = chat.unreadCounts as Map<string, number>;

                // If the participant is NOT the sender, increment their count
                if (participantIdStr !== senderIdStr) {
                    const currentCount = unreadCounts.get(participantIdStr) || 0;
                    unreadCounts.set(participantIdStr, currentCount + 1);
                } else {
                    // Always clear the sender's unread count when they send a message
                    unreadCounts.set(participantIdStr, 0);
                }
            });

            await chat.save();
        }

        // Send the populated message object back to the client
        res.status(201).json(message);

    } catch (error) {
        console.error('Error sending message:', error)
        res.status(500).json({ message: 'Error sending message.'});
    }
};

/**
 * @desc Mark all messaes in a chat as read for the current user
 * @route PUT /api/messages/read
 * @access Private
 * @body { chatId }
 */
export const markMessagesAsRead: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const { chatId } = authReq.body;
    const currentUserId = authReq.user!.id;

    if (!chatId || !currentUserId) {
        res.status(400).json({ message: 'Chat ID required.' });
        return;
    }

    try {
        // Update Message Status: Change status from 'delivered' to 'read' for all *other* senders
        await Message.updateMany(
            {
               chatId: chatId,
               senderId: { $ne: currentUserId }, // Only mark messagges sent by others
               status: { $in: ['sent', 'delivered'] } // Only change if not already read
            },
            { $set: { status: 'read' } }
        );

        // Clear Unread Count: Clear the count for the current user in the Chat document
        const chat =  await Chat.findById(chatId);
        if (chat) {
            const unreadCounts = chat.unreadCounts as Map<string, number>;
            unreadCounts.set(currentUserId, 0);
            await chat.save();
        }

        // SOCKET.IO Broacast

        // Find the other user in the chat
        const otherParticipantId = chat?.participants
            .find(id => id.toString() !== currentUserId.toString());

        if (otherParticipantId) {
            // Emit event to the other user's personal room (ID)
            io.to(otherParticipantId.toString()).emit('messages read', chatId);
        }

        res.status(200).json({ message: 'Messages marked as read and count cleared.' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error during read receipt update.' });
    }
};