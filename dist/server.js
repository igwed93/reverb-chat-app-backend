"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables from .env file
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const db_1 = __importDefault(require("./db"));
const socket_io_1 = require("socket.io");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const Chat_1 = __importDefault(require("./models/Chat"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
require("./config/passport");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // Next.js frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express_1.default.json()); // Body parser for JSON requests
// Session Middleware Setup
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24 * 30 } // 30 days
}));
// Passport Initialization
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Mount Authentication Routes
app.use('/api/auth', authRoutes_1.default); // All auth routes start with /api/auth
// Mount User Routes
app.use('/api/users', userRoutes_1.default);
// Mount Chat Routes
app.use('/api/chats', chatRoutes_1.default);
// Mount Message Routes
app.use('/api/messages', messageRoutes_1.default);
// Basic Route
app.get('/', (_req, res) => {
    res.status(200).json({ message: 'Reverb API is running!' });
});
// Global map to track which user is connected to which socket ID
// Key: User ID (string) | Value: Socket ID (string)
const onlineUsers = new Map();
// Initialize Socket.IO
exports.io = new socket_io_1.Server(server, {
    pingTimeout: 60000, // Disconnects after 60s of inactivity
    cors: {
        origin: 'http://localhost:3000', // Next.js frontend URL
        methods: ['GET', 'POST']
    }
});
// Socket.IO connection Handler
exports.io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    // SETUP: When a user logs in, they join their own room using their User ID
    socket.on('setup', (userId) => {
        // userId comes from the client after successful authentication
        socket.join(userId);
        // Track the user as online
        onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} joined room and is tracked online.`);
        // Notify client side that setup is complete and share the current online users lists
        exports.io.emit('get-online-users', Array.from(onlineUsers.keys()));
    });
    // JOIN CHAT: When a user opens a chat, they join that specific chat room
    socket.on('join chat', (chatId) => {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });
    // NEW MESSAGE: Handle incoming messages from the client
    socket.on('new message', async (newMessageReceived) => {
        // newMessageReceived is the message object returned from the POST /api/messages
        // Get the Chat ID from the incoming message object
        const chatId = newMessageReceived.chatId;
        // Fetch the Chat document from the database to get the participants list
        const chat = await Chat_1.default.findById(chatId).select('participants');
        if (!chat || !chat.participants || chat.participants.length === 0) {
            return console.log('Chat participants not defined.');
        }
        // Send the message to ALL other participants in the chat
        chat.participants.forEach((participantId) => {
            const userId = participantId.toString();
            // Do not send the message back to the sender
            if (userId === newMessageReceived.senderId._id.toString())
                return;
            // Broadcast the message to the receiver's personal room (userId)
            // io.to() targets a specific room/socket
            exports.io.to(userId).emit('message received', newMessageReceived);
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
                exports.io.emit('get-online-users', Array.from(onlineUsers.keys())); // Broadcast updated list
                break;
            }
        }
    });
});
// Start Server function
const startServer = async () => {
    // Connect to MongoDB
    await (0, db_1.default)();
    // Start Express/Socket.IO Server
    server.listen(PORT, () => {
        console.log(`⚡️ Reverb Server is running on http://localhost:${PORT}`);
    });
};
startServer(); // Start the server
//# sourceMappingURL=server.js.map