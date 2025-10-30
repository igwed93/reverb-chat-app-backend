import mongoose, { Schema, model } from 'mongoose';
import { IUser } from '../types/models';

// --- Define the User schema ---
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false, // Optional if using social login
      select: false, // Exclude by default from queries
    },
    avatarUrl: {
      type: String,
      default: '', // Empty string if user hasn’t uploaded avatar
    },
    status: {
      type: String,
      enum: ['Online', 'Offline', 'Busy'],
      default: 'Offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    chats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
      },
    ],
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// --- Create and export the User model ---
const User = model<IUser>('User', userSchema);
export default User;
