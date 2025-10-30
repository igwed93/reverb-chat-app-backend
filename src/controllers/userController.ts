import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types/express.d';

/**
 * @desc Get current authenticated user profile
 * @route GET /api/users/profile
 * @access Private
 */
export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if(!userId) {
            return res.status(401).json({ message: 'User ID missing from token' });
        }

        const user = await User.findById(userId).select('-password -chats');

        if (user) {
            res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            status: user.status,
            lastSeen: user.lastSeen,
            }); 
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching profile.' });
    }
}

/**
 * @desc Search for users by username or email
 * @route GET /api/users?search=<keyword>
 * @access Private
 */
export const searchUsers = async (req: AuthRequest, res: Response) => {
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
    const users = await User.find({ ...keyword, _id: { $ne: req.user.id } }).select('username email avatarUrl status');

    res.send(users);
}

/**
 * @desc Log out user (set status to Offline)
 * @route POST /api/users/logout
 * @access Private
 */
export const logoutUser = async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    try {
        // Crucial: Select the password hash to prevent accidental deletion during save
        const user = await User.findById(userId).select('+password'); 
        
        if (user) {
            user.status = 'Offline';
            user.lastSeen = new Date();
            await user.save();
        }
        res.status(200).json({ message: 'User status set to Offline' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Logout failed.' });
    }
};


/**
 * @desc Update the authenticated user's profile picture
 * @route PUT /api/users/avatar
 * @access Private
 * @body { avatarUrl: string } (Actual implementation uses multipart/form-data)
 */
export const updateUserAvatar = async (req: AuthRequest, res: Response) => {
    // NOTE: this should handle file upload via Multer first.
    // For now, we assume the frontend sends a URL (e.g., a temporary pre-signed URL).
    const { avatarUrl } = req.body;
    const userId = req.user.id;

    if (!avatarUrl) {
        return res.status(400).json({ message: 'Avatar URL is required.' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { avatarUrl: avatarUrl },
            { new: true, select: '-password -chats' }
        );

        if (user) {
            res.status(200).json({ 
                _id: user._id, 
                avatarUrl: user.avatarUrl,
                message: 'Avatar updated successfully' 
            });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ message: 'Server error updating avatar.' });
    }
};