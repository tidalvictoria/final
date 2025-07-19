const Notification = require('../models/Notification');

// @desc    Get all notifications for the authenticated user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 }); // Latest notifications first

        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark a specific notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
        }

        // Ensure the notification belongs to the authenticated user
        if (notification.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this notification' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Notification ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Clear all notifications (mark as read or delete) for the authenticated user
// @route   DELETE /api/notifications/clear-all
// @access  Private
const clearAllNotifications = async (req, res) => {
    try {
        // Option 1: Mark all as read (less destructive)
        await Notification.updateMany({ userId: req.user._id }, { isRead: true });

        // Option 2: Delete all read notifications (more destructive, if you prefer clearing)
        // await Notification.deleteMany({ userId: req.user._id, isRead: true });
        // Or delete all regardless of read status:
        // await Notification.deleteMany({ userId: req.user._id });

        res.status(200).json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a specific notification by ID
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
        }

        // Ensure the notification belongs to the authenticated user
        if (notification.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this notification' });
        }

        await Notification.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Notification ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getNotifications,
    markNotificationAsRead,
    clearAllNotifications,
    deleteNotificationById,
};