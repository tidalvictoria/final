const express = require('express');
const {
    getNotifications,
    markNotificationAsRead,
    clearAllNotifications,
    deleteNotificationById
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/', protect, getNotifications);

// Mark a specific notification as read
router.put('/:id/read', protect, markNotificationAsRead);

// Clear (mark all as read or delete all) notifications for the authenticated user
router.delete('/clear-all', protect, clearAllNotifications);

// Delete a specific notification (e.g., if a user wants to dismiss it permanently)
router.delete('/:id', protect, deleteNotificationById);

module.exports = router;