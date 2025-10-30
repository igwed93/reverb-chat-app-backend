import mongoose, { Schema, model } from 'mongoose';
import { IMessage } from '../types/models';

const messageSchema = new Schema<IMessage>(
    {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    fileUrl: { type: String, required: false },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
  },
  { timestamps: true }  
)

export default (mongoose.models.Message as mongoose.Model<IMessage>) ||
  model<IMessage>('Message', messageSchema);