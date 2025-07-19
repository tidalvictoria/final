const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['signature_request', 'document_signed', 'invitation_accepted' /* add other notification types here */ ],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: false, // Or true, depending on your schema. Most notifications might not have a document.
    },
    read: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

// Optional: Add an index for faster query by userId and isRead status
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);