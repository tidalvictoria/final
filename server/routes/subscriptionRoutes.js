const express = require('express');
const {
  getSubscription,
  updateSubscription,
  createSubscription, // For initial subscription creation
  cancelSubscription, // To initiate cancellation
  // handleStripeWebhook // (This would be a separate, dedicated endpoint)
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Create initial subscription (can be part of user registration or a separate process)
// This might be called by the frontend after Stripe Checkout success
router.post('/', protect, createSubscription);

// Get authenticated user's subscription details
router.get('/me', protect, getSubscription);

// Update subscription details (e.g., plan change, staff count)
router.put('/:id', protect, updateSubscription); // Or router.put('/me', ...)

// Cancel subscription
router.post('/:id/cancel', protect, cancelSubscription); // Or router.post('/me/cancel', ...)

module.exports = router;