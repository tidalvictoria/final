const express = require('express');
const {
  getUpcomingRenewals,
  getRenewalById,
  updateRenewal,
  createRenewal, // Agencies might create renewals for their staff
  deleteRenewal // Agencies might delete mistaken entries
} = require('../controllers/renewalController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new renewal record (primarily for Agencies or Admin)
router.post('/', protect, authorizeRoles(['Agency', 'Admin']), createRenewal);

// Get upcoming renewals for the authenticated user (or for an agency's view)
router.get('/upcoming', protect, getUpcomingRenewals);

// Get a single renewal by ID
router.get('/:id', protect, getRenewalById);

// Update a renewal record
router.put('/:id', protect, updateRenewal);

// Delete a renewal record
router.delete('/:id', protect, authorizeRoles(['Agency', 'Admin']), deleteRenewal);


module.exports = router;