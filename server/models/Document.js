const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    userId: { // Who owns or uploaded this document
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    agencyId: { // For documents belonging to an agency or staff under an agency
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    fileName: {
        type: String,
        required: true,
    },
    fileUrl: { // URL to the stored document (e.g., S3, Google Cloud Storage)
        type: String,
        required: true,
    },
    fileMimeType: String,
    category: { // e.g., 'License', 'Certification', 'HR Form', 'Contract'
        type: String,
        required: true,
    },
    expirationDate: { // For licenses/certifications
        type: Date,
        default: null,
    },
    uploadDate: {
        type: Date,
        default: Date.now,
    },
    isSigned: { // For e-signature feature
        type: Boolean,
        default: false,
    },
    signedBy: [{ // Who signed it
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        signedAt: Date,
    }],
    status: { // e.g., 'Pending Signature', 'Approved', 'Rejected', 'Uploaded'
        type: String,
        enum: ['Pending Signature', 'Pending Review', 'Approved', 'Rejected', 'Uploaded', 'Signed'],
        default: 'Uploaded',
    },

    signatureRequested: {
        type: Boolean,
        default: false,
    },
    signatureRequester: { // Who requested the signature
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    signatureRecipient: { // Who is intended to sign the document
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    signedDate: { // When the document was signed (singular date)
        type: Date,
        default: null,
    },

    // Any other metadata for the document
    metadata: Object,
    }, {
    timestamps: true,
});

module.exports = mongoose.model('Document', DocumentSchema);