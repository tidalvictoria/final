const mongoose = require('mongoose');

const RenewalSchema = new mongoose.Schema({
    userId: { // The user (Staff or Individual) whose renewal it is
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    agencyId: { // If the user is staff, link to their agency
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    itemType: { // What is being renewed (e.g., 'License', 'Certification')
        type: String,
        required: true,
    },
    itemName: { // Name of the license/certification (e.g., 'RN License', 'BLS Certification')
        type: String,
        required: true,
    },
    currentExpirationDate: {
        type: Date,
        required: true,
    },
    newExpirationDate: { // After renewal is completed
        type: Date,
        default: null,
    },
    documentId: { // Link to the renewed document
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        default: null,
    },
    status: { // e.g., 'Pending', 'Completed', 'Overdue'
        type: String,
        enum: ['Pending', 'Completed', 'Overdue', 'Notified'],
        default: 'Pending',
    },
    notificationSent: { // To track if notifications have been sent
        type: Boolean,
        default: false,
    },
    notificationDates: [Date], // Array of dates when notifications were sent
    // Any other renewal-specific fields
    notes: String,
    }, {
    timestamps: true,
});

module.exports = mongoose.model('Renewal', RenewalSchema);