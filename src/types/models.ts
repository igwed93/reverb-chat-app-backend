import { Document, Types } from 'mongoose';

// Structure to hold roles for each group the user is in
export interface IGroupRole {
    chatId: Types.ObjectId;
    role: 'owner' | 'admin' | 'member';
}

// ---- I. User Interface ----
export interface IUser extends Document {
    _id: Types.ObjectId;
    username: string;
    email: string;
    password?: string; // Optional if using social login
    avatarUrl: string;
    status: 'Online' | 'Offline' | 'Busy';
    lastSeen: Date;
    chats: Types.ObjectId[]; // Array of Chat IDs
    groupRoles: IGroupRole[];
    createdAt: Date;
    updatedAt: Date;
}


// ---- II. Message Interface ----
export interface IMessage extends Document {
    chatId: Types.ObjectId; // Chat ID
    senderId: Types.ObjectId; // User ID
    content: string; // Message content (text, link)
    type: 'text' | 'image' | 'file';
    fileUrl?: string; // URL for attachments
    status: 'sent' | 'delivered' | 'read';
    createdAt: Date;
}

// ---- III. Chat Interface (Conversation) ----
export interface IChat extends Document {
    isGroup: boolean;
    name?: string; // Optional for group chats
    participants: Types.ObjectId[]; // Array of User IDs
    lastMessage: Types.ObjectId | null; // ID of the most recent message
    unreadCounts: Map<string, number> | Record<string, number>; // { userID: count } for unread messages
    createdAt: Date;
    updatedAt: Date;
}