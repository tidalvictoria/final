const express = require('express');
const multer = require('multer');
const {
    uploadDocument,
    getDocuments,
    getDocumentById,
    deleteDocument,
    requestSignature,
    markAsSigned,
    updateDocumentStatus
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure Multer for in-memory storage (file will be in req.file.buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB (adjust as needed)
    fileFilter: (req, file, cb) => {
        // Optional: Filter file types
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/') || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
        } else {
        cb(new Error('Invalid file type. Only PDF, image, and Word documents are allowed.'), false);
        }
    }
});


// Document Upload (now uses multer middleware for single file upload)
// 'document' is the field name in your form where the file will be sent
router.post('/upload', protect, upload.single('document'), uploadDocument); // Add upload.single('document')


// Get all documents for the authenticated user (or for an agency's staff)
router.get('/', protect, getDocuments);

// Get a single document by ID
router.get('/:id', protect, getDocumentById);

// Delete a document (e.g., user deleting their own, agency deleting staff doc)
router.delete('/:id', protect, deleteDocument);

// Request e-signature (typically Agency to Staff/Individual)
router.post('/:id/request-signature', protect, authorizeRoles(['Agency']), requestSignature);

// Mark document as signed (Staff/Individual signing their own doc)
router.put('/:id/mark-signed', protect, markAsSigned);

// Update document status (e.g., from 'Pending Signature' to 'Approved' by Agency)
router.put('/:id/status', protect, authorizeRoles(['Agency']), updateDocumentStatus);


module.exports = router;