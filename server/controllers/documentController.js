const Document = require('../models/Document');
const User = require('../models/User'); // To link users to documents
const Notification = require('../models/Notification'); // For sending notifications
const { uploadFile, deleteFile } = require('../utils/s3Service'); // Import S3 service

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = async (req, res) => {
    // Multer will place the file in req.file if it's a single file upload
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const { category, expirationDate } = req.body; // Other fields from the form
        const userId = req.user._id;
        let agencyId = null;

        if (req.user.role === 'Staff' && req.user.agencyId) {
            agencyId = req.user.agencyId;
        } else if (req.user.role === 'Agency') {
            agencyId = req.user._id;
        }

        // Upload file to S3
        const fileUrl = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);

        const newDocument = await Document.create({
            userId,
            agencyId,
            fileName: req.file.originalname,
            fileUrl: fileUrl,
            fileMimeType: req.file.mimetype,
            category,
            expirationDate: expirationDate ? new Date(expirationDate) : null,
        });

        res.status(201).json({ message: 'Document uploaded successfully', document: newDocument });

    } catch (error) {
        console.error(error);
        if (error.message === 'Failed to upload file to S3') { // Catch specific S3 error
            return res.status(500).json({ message: 'Failed to upload document to storage' });
        }
        if (error.message.includes('Invalid file type')) { // Catch Multer file filter error
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error during document upload' });
    }
};

// @desc    Get all documents for the authenticated user (or for an agency's staff)
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'Agency') {
            // An Agency user can see all documents they uploaded AND documents uploaded by their staff.
            // This assumes documents have a userId and optionally an agencyId if staff-related.
            const staffUserIds = await User.find({ agencyId: req.user._id }).select('_id');
            const allRelatedUserIds = [req.user._id, ...staffUserIds.map(id => id._id)];
            query = { userId: { $in: allRelatedUserIds } };
        } else {
            // Staff/Individual users can only see their own documents.
            query = { userId: req.user._id };
        }

        const documents = await Document.find(query).sort({ createdAt: -1 }); // Latest documents first
        res.status(200).json(documents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single document by ID
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Authorization: User can view their own document OR
        // Agency can view documents associated with their agency.
        if (document.userId.toString() === req.user._id.toString() ||
            (req.user.role === 'Agency' && document.agencyId && document.agencyId.toString() === req.user._id.toString())) {
            return res.status(200).json(document);
        } else {
            return res.status(403).json({ message: 'Not authorized to view this document' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Document ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Request e-signature (typically Agency to Staff/Individual)
// @route   POST /api/documents/:id/request-signature
// @access  Private (Agency only)
const requestSignature = async (req, res) => {
    // Get recipientId and message from the body
    const { recipientId, message } = req.body;
    // The requesterId should always be the authenticated user's ID
    const requesterId = req.user._id; // <<< THIS IS THE CRITICAL CHANGE


    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // --- Authorization check for Agency role is correctly handled ---
        // Only Agency can request signature on documents they own or manage
        // (Assuming you have authorizeRoles(['Agency']) middleware on the route)
        if (req.user.role !== 'Agency') { // Basic check if middleware failed or was missed
            return res.status(403).json({ message: 'Only Agency users can request signatures.' });
        }

        // Verify that the document belongs to this agency (either uploaded by agency or its staff)
        // This check is important if an Agency tries to request signature for a document not managed by them.
        const documentOwner = await User.findById(document.userId);
        const isDocumentOwnedByAgencyOrStaff = (document.userId.toString() === requesterId.toString()) ||
                                            (documentOwner && documentOwner.agencyId && documentOwner.agencyId.toString() === requesterId.toString());

        if (!isDocumentOwnedByAgencyOrStaff) {
            return res.status(403).json({ message: 'Not authorized to request signature for this document (document not managed by your agency).' });
        }
        // --- End of Authorization Refinement ---

        // Verify recipient exists and is not the requester
        if (!recipientId) {
            return res.status(400).json({ message: 'Recipient ID is required.' });
        }
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Signature recipient user not found.' });
        }
        if (recipient._id.toString() === requesterId.toString()) {
            return res.status(400).json({ message: 'You cannot request a signature from yourself.' });
        }
        // Optional: Ensure recipient is Staff or Individual, and potentially linked to this agency
        if (recipient.role !== 'Staff' && recipient.role !== 'Individual') {
            return res.status(400).json({ message: 'Signature can only be requested from Staff or Individual users.' });
        }
        if (recipient.role === 'Staff' && (!recipient.agencyId || recipient.agencyId.toString() !== requesterId.toString())) {
            return res.status(403).json({ message: 'Staff recipient is not linked to your agency.' });
        }


        // Update document status and add signature request details
        document.status = 'Pending Signature';
        document.signatureRequested = true;
        document.signatureRequester = requesterId; // Correctly use the authenticated user's ID
        document.signatureRecipient = recipientId; // This ID must be valid and exist
        await document.save();

        // Create a notification for the recipient
        await Notification.create({
            userId: recipientId,
            type: 'signature_request',
            message: `Signature requested for document: ${document.fileName}. ${message ? `Message: ${message}` : ''}`,
            documentId: document._id,
            read: false // Add this if you track read status
        });

        res.status(200).json({ message: 'Signature requested successfully', document });
    } catch (error) {
        console.error(error); // <<< THIS IS WHERE THE REAL ERROR IS LOGGED IN YOUR SERVER CONSOLE
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Document ID or Recipient ID provided.' }); // More specific error
        }
        res.status(500).json({ message: 'Server Error during signature request.' }); // More specific message
    }
};

// @desc    Mark document as signed (Staff/Individual signing their own doc)
// @route   PUT /api/documents/:id/mark-signed
// @access  Private
const markAsSigned = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Only the intended recipient can mark it as signed
        if (!document.signatureRecipient || document.signatureRecipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to sign this document' });
        }

        document.status = 'Signed';
        document.signed = true;
        document.signedDate = new Date();
        document.signedBy = req.user._id;
        document.signedBy.push({ // Push a new object into the signedBy array
            userId: req.user._id,
            signedAt: new Date()
        });
        await document.save();

        // Optionally, notify the original requester (Agency)
        if (document.signatureRequester) {
            await Notification.create({
                userId: document.signatureRequester,
                type: 'document_signed',
                message: `Document "${document.fileName}" has been signed by ${req.user.username}.`,
                documentId: document._id,
            });
        }

        res.status(200).json({ message: 'Document marked as signed', document });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Document ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update document status (e.g., from 'Pending Signature' to 'Approved' by Agency)
// @route   PUT /api/documents/:id/status
// @access  Private (Agency only)
const updateDocumentStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Only Agency users can update document status, and only for documents they manage
        if (req.user.role !== 'Agency' || (document.agencyId && document.agencyId.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to update this document status' });
        }

        document.status = status;
        await document.save();

        res.status(200).json({ message: 'Document status updated successfully', document });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Document ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Authorization: User can delete their own docs.
        // Agency can delete documents associated with their agency.
        if (document.userId.toString() === req.user._id.toString() ||
            (req.user.role === 'Agency' && document.agencyId && document.agencyId.toString() === req.user._id.toString())) {

            // Delete file from S3 before deleting document record
            if (document.fileUrl) { // Ensure there's a URL to delete
                await deleteFile(document.fileUrl);
            }

            await Document.deleteOne({ _id: req.params.id }); // Using deleteOne for clarity
            res.status(200).json({ message: 'Document removed successfully' });
        } else {
            return res.status(403).json({ message: 'Not authorized to delete this document' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Document ID' });
        }
        if (error.message === 'Failed to delete file from S3') {
            return res.status(500).json({ message: 'Failed to delete file from storage. Document not deleted.' });
        }
        res.status(500).json({ message: 'Server Error during document deletion' });
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    getDocumentById,
    deleteDocument,
    requestSignature,
    markAsSigned,
    updateDocumentStatus,
};