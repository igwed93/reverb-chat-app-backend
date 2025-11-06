import { Document, Types } from 'mongoose';
export interface IGroupRole {
    chatId: Types.ObjectId;
    role: 'owner' | 'admin' | 'member';
}
export interface IUser extends Document {
    _id: Types.ObjectId;
    username: string;
    email: string;
    password?: string;
    avatarUrl: string;
    status: 'Online' | 'Offline' | 'Busy';
    lastSeen: Date;
    chats: Types.ObjectId[];
    groupRoles: IGroupRole[];
    createdAt: Date;
    updatedAt: Date;
}
export interface IMessage extends Document {
    chatId: Types.ObjectId;
    senderId: Types.ObjectId;
    content: string;
    type: 'text' | 'image' | 'file';
    fileUrl?: string;
    status: 'sent' | 'delivered' | 'read';
    createdAt: Date;
}
export interface IChat extends Document {
    isGroup: boolean;
    name?: string;
    participants: Types.ObjectId[];
    lastMessage: Types.ObjectId | null;
    unreadCounts: Map<string, number> | Record<string, number>;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=models.d.ts.map