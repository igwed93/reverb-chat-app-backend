"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserAvatar = exports.logoutUser = exports.searchUsers = exports.getUserProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
/**
 * @desc Get current authenticated user profile
 * @route GET /api/users/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'User ID missing from token' });
            return;
        }
        const user = await User_1.default.findById(userId).select('-password -chats');
        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                status: user.status,
                lastSeen: user.lastSeen,
            });
        }
        else {
            res.status(404).json({ message: 'User not found.' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching profile.' });
    }
};
exports.getUserProfile = getUserProfile;
/**
 * @desc Search for users by username or email
 * @route GET /api/users?search=<keyword>
 * @access Private
 */
const searchUsers = async (req, res) => {
    const keyword = req.query.search
        ? {
            // MongoDB $or operator for multiple field search
            $or: [
                // Case-insensitive regex match for username
                { username: { $regex: req.query.search, $options: 'i' } },
                // Case-insensitive regex match for email
                { email: { $regex: req.query.search, $options: 'i' } },
            ],
        }
        : {};
    // Exclude the currently logged-in user from the search results
    const users = await User_1.default.find({ ...keyword, _id: { $ne: req.user.id } }).select('username email avatarUrl status');
    res.send(users);
};
exports.searchUsers = searchUsers;
/**
 * @desc Log out user (set status to Offline)
 * @route POST /api/users/logout
 * @access Private
 */
const logoutUser = async (req, res) => {
    const userId = req.user.id;
    try {
        // Crucial: Select the password hash to prevent accidental deletion during save
        const user = await User_1.default.findById(userId).select('+password');
        if (user) {
            user.status = 'Offline';
            user.lastSeen = new Date();
            await user.save();
        }
        res.status(200).json({ message: 'User status set to Offline' });
    }
    catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Logout failed.' });
    }
};
exports.logoutUser = logoutUser;
/**
 * @desc Update the authenticated user's profile picture
 * @route PUT /api/users/avatar
 * @access Private
 * @body { avatarUrl: string } (Actual implementation uses multipart/form-data)
 */
const updateUserAvatar = async (req, res) => {
    // NOTE: this should handle file upload via Multer first.
    // For now, we assume the frontend sends a URL (e.g., a temporary pre-signed URL).
    const { avatarUrl } = req.body;
    const userId = req.user.id;
    if (!avatarUrl) {
        res.status(400).json({ message: 'Avatar URL is required.' });
        return;
    }
    try {
        const user = await User_1.default.findByIdAndUpdate(userId, { avatarUrl: avatarUrl }, { new: true, select: '-password -chats' });
        if (user) {
            res.status(200).json({
                _id: user._id,
                avatarUrl: user.avatarUrl,
                message: 'Avatar updated successfully'
            });
        }
        else {
            res.status(404).json({ message: 'User not found.' });
        }
    }
    catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ message: 'Server error updating avatar.' });
    }
};
exports.updateUserAvatar = updateUserAvatar;
//# sourceMappingURL=userController.js.map