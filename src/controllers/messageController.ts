import { Request, Response } from 'express';
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
export const allMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { chatId } = req.params;

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
export const sendMessage = async (req: AuthRequest, res: Response) => {
    const { chatId, content } = req.body;
    const senderId = req.user?.id;

    if (!chatId || !content || !senderId) {
        return res.status(400).json({ message: 'Invalid data passed into request.' });
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

                // If the participant is NOT the sender, increment their count
                if (participantIdStr !== senderIdStr) {
                    const currentCount = chat.unreadCounts.get(participantIdStr) || 0;
                    chat.unreadCounts.set(participantIdStr, currentCount + 1);

                    // TODO: We could emit a socket event here to force the receiver's ChatList to update,
                    // but we will handle the ChatList update on the frontend from the 'message received' event.
                } else {
                    // Always clear the sender's unread count when they send a message
                    chat.unreadCounts.set(participantIdStr, 0);
                }
            });

            await chat.save();
        }

        // Send the populated message object back to the client
        res.status(201).json(message);

         // IMPORTANT: The real-time broadcast via Socket.IO happens immediately after this successful DB operation.
        // This part will be handled in the Socket.IO setup (Step 14).

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
export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
    const { chatId } = req.body;
    const currentUserId = req.user?.id;

    if (!chatId || !currentUserId) {
        return res.status(400).json({ message: 'Chat ID required.' });
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
            chat.unreadCounts.set(currentUserId, 0);
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