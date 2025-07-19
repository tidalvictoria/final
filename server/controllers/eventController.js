const Event = require('../models/Event');
const User = require('../models/User'); // To determine agency context

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
    const { title, description, start, end, allDay, location, attendees } = req.body;

    try {
        const userId = req.user._id;
        let agencyId = null;

        // If the user is Staff, associate with their Agency
        if (req.user.role === 'Staff' && req.user.agencyId) {
        agencyId = req.user.agencyId;
        } else if (req.user.role === 'Agency') {
        agencyId = req.user._id; // Agency creates its own event
        }

        const newEvent = await Event.create({
        userId,
        agencyId,
        title,
        description,
        start: new Date(start),
        end: new Date(end),
        allDay: allDay || false,
        location,
        attendees: attendees || [], // Add attendees if provided
        });

        res.status(201).json({ message: 'Event created successfully', event: newEvent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get events for the authenticated user (or relevant to their agency)
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'Agency') {
        // An Agency user can see all events they created and potentially events created by their staff.
        // For now, let's include events created by the agency AND events created by staff of this agency.
        const staffUserIds = await User.find({ agencyId: req.user._id }).select('_id');
        const allRelatedUserIds = [req.user._id, ...staffUserIds.map(id => id._id)];
        query = { userId: { $in: allRelatedUserIds } };

        // You might also want to query by agencyId field directly if events are marked for an agency.
        // query = { $or: [{ userId: { $in: allRelatedUserIds } }, { agencyId: req.user._id }] };

        } else {
        // Staff/Individual users can only see their own events.
        query = { userId: req.user._id };
        }

        const events = await Event.find(query).sort({ start: 1 }); // Sort by start date
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single event by ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
        return res.status(404).json({ message: 'Event not found' });
        }

        // Authorization: User can view their own event OR
        // Agency can view events created by them or their staff
        if (event.userId.toString() === req.user._id.toString() ||
            (req.user.role === 'Agency' && event.agencyId && event.agencyId.toString() === req.user._id.toString())) {
        return res.status(200).json(event);
        } else {
        return res.status(403).json({ message: 'Not authorized to view this event' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Event ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = async (req, res) => {
    const { title, description, start, end, allDay, location, attendees } = req.body;

    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
        return res.status(404).json({ message: 'Event not found' });
        }

        // Authorization: User can update their own event OR
        // Agency can update events created by them or their staff
        if (event.userId.toString() === req.user._id.toString() ||
            (req.user.role === 'Agency' && event.agencyId && event.agencyId.toString() === req.user._id.toString())) {

        event.title = title || event.title;
        event.description = description || event.description;
        event.start = start ? new Date(start) : event.start;
        event.end = end ? new Date(end) : event.end;
        event.allDay = (allDay !== undefined) ? allDay : event.allDay;
        event.location = location || event.location;
        event.attendees = attendees || event.attendees; // Handle array updates carefully

        await event.save();
        res.status(200).json({ message: 'Event updated successfully', event });
        } else {
        return res.status(403).json({ message: 'Not authorized to update this event' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Event ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
        return res.status(404).json({ message: 'Event not found' });
        }

        // Authorization: User can delete their own event OR
        // Agency can delete events created by them or their staff
        if (event.userId.toString() === req.user._id.toString() ||
            (req.user.role === 'Agency' && event.agencyId && event.agencyId.toString() === req.user._id.toString())) {

        await Event.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Event deleted successfully' });
        } else {
        return res.status(403).json({ message: 'Not authorized to delete this event' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Event ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
};