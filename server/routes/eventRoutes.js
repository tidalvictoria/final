const express = require('express');
const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new event
router.post('/', protect, createEvent);

// Get events for the authenticated user (or for an agency's view)
router.get('/', protect, getEvents);

// Get a single event by ID
router.get('/:id', protect, getEventById);

// Update an event
router.put('/:id', protect, updateEvent);

// Delete an event
router.delete('/:id', protect, deleteEvent);

module.exports = router;