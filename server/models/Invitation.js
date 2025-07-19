const mongoose = require('mongoose');
const crypto = require('crypto');

const InvitationSchema = new mongoose.Schema({
    agencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipientEmail: { // Always required now
        type: String,
        required: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ],
    },
    recipientId: { // This will only be populated if the invited user exists at the time of invite
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Expired'],
        default: 'Pending',
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    acceptedAt: {
        type: Date,
        default: null,
    },
    message: {
        type: String,
    },
}, { timestamps: true });

// --- Middleware to generate token and expiry before saving ---
InvitationSchema.pre('save', function(next) {
    if (!this.isNew) {
        return next();
    }
    const token = crypto.randomBytes(32).toString('hex');
    this.token = token;
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    next();
});

module.exports = mongoose.model('Invitation', InvitationSchema);