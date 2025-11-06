import express from 'express';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import type { Application, Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import connectDB from './db';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import messageRoutes from './routes/messageRoutes';
import Chat from './models/Chat';
import session from 'express-session';
import passport from 'passport';
import './config/passport';


const app: Application = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Next.js frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(express.json());  // Body parser for JSON requests

// Session Middleware Setup
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24 * 30 } // 30 days
}));

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// Mount Authentication Routes
app.use('/api/auth', authRoutes); // All auth routes start with /api/auth

// Mount User Routes
app.use('/api/users', userRoutes);

// Mount Chat Routes
app.use('/api/chats', chatRoutes);

// Mount Message Routes
app.use('/api/messages', messageRoutes);

// Basic Route
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Reverb API is running!' });
});


// Global map to track which user is connected to which socket ID
// Key: User ID (string) | Value: Socket ID (string)
const onlineUsers = new Map<string, string>();

// Initialize Socket.IO
export const io = new SocketIOServer(server, {
    pingTimeout: 60000, // Disconnects after 60s of inactivity
    cors: {
        origin: 'http://localhost:3000', // Next.js frontend URL
        methods: ['GET', 'POST']
    }
});

// Socket.IO connection Handler
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // SETUP: When a user logs in, they join their own room using their User ID
    socket.on('setup', (userId: string) => {
        // userId comes from the client after successful authentication
        socket.join(userId);

        // Track the user as online
        onlineUsers.set(userId, socket.id);

        console.log(`User ${userId} joined room and is tracked online.`)

        // Notify client side that setup is complete and share the current online users lists
        io.emit('get-online-users', Array.from(onlineUsers.keys()));
    });

    // JOIN CHAT: When a user opens a chat, they join that specific chat room
    socket.on('join chat', (chatId: string) => {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    // NEW MESSAGE: Handle incoming messages from the client
    socket.on('new message', async (newMessageReceived: any) => {
        // newMessageReceived is the message object returned from the POST /api/messages
        // Get the Chat ID from the incoming message object
        const chatId = newMessageReceived.chatId;

        // Fetch the Chat document from the database to get the participants list
        const chat = await Chat.findById(chatId).select('participants');

        if (!chat || !chat.participants || chat.participants.length === 0) {
            return console.log('Chat participants not defined.');
        }

        // Send the message to ALL other participants in the chat
        chat.participants.forEach((participantId) => {
            const userId = participantId.toString();

            // Do not send the message back to the sender
            if (userId === newMessageReceived.senderId._id.toString()) return;

            // Broadcast the message to the receiver's personal room (userId)
            // io.to() targets a specific room/socket
            io.to(userId).emit('message received', newMessageReceived);
        });
    });

    // TYPING/STOP TYPING indicators
    socket.on('typing', (chatId) => socket.in(chatId).emit('typing'));
    socket.on('stop typing', (chatId) => socket.in(chatId).emit('stop typing'));

    // DISCONNECT: User disconnects (Socket.IO handles reconnection automatically)
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove user from the online list upon actual disconnect
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit('get-online-users', Array.from(onlineUsers.keys())); // Broadcast updated list
                break;
            }
        }
    });
});

// Start Server function
const startServer = async () => {
    // Connect to MongoDB
    await connectDB();

    // Start Express/Socket.IO Server
    server.listen(PORT, () => {
        console.log(`⚡️ Reverb Server is running on http://localhost:${PORT}`);
    });
};

startServer(); // Start the server
