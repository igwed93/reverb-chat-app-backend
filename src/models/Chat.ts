import mongoose, { Schema, model } from 'mongoose';
import { IChat } from '../types/models';

const chatSchema = new Schema<IChat>(
    {
        isGroup: { type: Boolean, default: false },
        name: { type: String, required: false }, // Required for group chats
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true, 
            },
        ],
        lastMessage: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
        // A Map stores key-value pairs where the key is a string (User ID) and the value is the unread count (number)
        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    { timestamps: true }
);

export default (mongoose.models.Chat as mongoose.Model<IChat>) ||
    model<IChat>('Chat', chatSchema);