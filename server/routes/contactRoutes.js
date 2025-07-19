const express = require('express');
const { contactSupport } = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware'); // Optional: require login for contact form

const router = express.Router();

// Route for contact support form. Can be protected or public.
// If public, you might want rate limiting to prevent spam.
router.post('/', contactSupport); // No 'protect' here if anonymous contact is allowed
// router.post('/', protect, contactSupport); // Use this if only logged-in users can contact

module.exports = router;