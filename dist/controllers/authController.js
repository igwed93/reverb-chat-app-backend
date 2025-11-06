"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
// Utility function to generate JWT
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables.');
    }
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};
/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = async (req, res) => {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    console.log({ username: username, email: email, password: password });
    if (!username || !email || !password) {
        res.status(400).json({ message: 'Please enter all fields.' });
        return;
    }
    try {
        // 1. Check if user already exists
        let user = await User_1.default.findOne({ email });
        if (user) {
            res.status(400).json({ message: 'User already exists.' });
            return;
        }
        // 2. Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashsedPassword = await bcryptjs_1.default.hash(password, salt);
        // 3. Create new user
        user = (await User_1.default.create({
            username,
            email,
            password: hashsedPassword,
            avatarUrl: '',
        }));
        // 4. Respond with user data and token
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            token: generateToken(user._id.toString()),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};
exports.registerUser = registerUser;
/**
 * @desc Authenticate user and get token
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ message: 'Please enter all fields.' });
        return;
    }
    try {
        // 1. Check for user by email
        const user = await User_1.default.findOne({ email }).select('+password');
        if (user && user.password) {
            // 2. Compare hashed password
            const isMatch = await bcryptjs_1.default.compare(password, user.password);
            if (isMatch) {
                // 3. Update status and respond with token
                user.status = 'Online';
                user.lastSeen = new Date();
                await user.save();
                const userResponse = user.toObject(); // Get a plain JS object
                delete userResponse.password; // Remove the property before sending
                res.json({
                    _id: userResponse._id,
                    username: userResponse.username,
                    email: userResponse.email,
                    avatarUrl: userResponse.avatarUrl,
                    token: generateToken(userResponse._id.toString()),
                });
                return;
            }
        }
        // Fallback for incorrect credentials
        res.status(401).json({ message: 'Invalid credentials.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};
exports.loginUser = loginUser;
//# sourceMappingURL=authController.js.map