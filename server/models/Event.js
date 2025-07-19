const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    userId: { // The user who owns/created this event
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    agencyId: { // Optional: If this event belongs to an agency or is visible to an agency's staff
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    start: { // Start date and time of the event
        type: Date,
        required: true,
    },
    end: { // End date and time of the event
        type: Date,
        required: true,
    },
    allDay: { // Whether the event is an all-day event
        type: Boolean,
        default: false,
    },
    location: { // Optional: Location of the event
        type: String,
        trim: true,
    },
    // Integration details (e.g., for Google Calendar/Outlook)
    integrations: {
        google: {
        eventId: String, // Google Calendar Event ID
        calendarId: String, // Google Calendar ID
        synced: { type: Boolean, default: false },
        },
        outlook: {
        eventId: String, // Outlook Calendar Event ID
        calendarId: String, // Outlook Calendar ID
        synced: { type: Boolean, default: false },
        },
    },
    // Optional attendees (e.g., for agency events involving specific staff)
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Add index for faster queries by user and date range
EventSchema.index({ userId: 1, start: 1, end: 1 });
EventSchema.index({ agencyId: 1, start: 1, end: 1 }); // If querying by agency

module.exports = mongoose.model('Event', EventSchema);