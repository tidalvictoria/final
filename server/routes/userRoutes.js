const express = require('express');
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getAgencyStaff
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // For authentication
const { authorizeRoles } = require('../middleware/authMiddleware'); // For authorization (we'll add this to authMiddleware)

const router = express.Router();

// Routes for getting and managing users
// Note: Roles like 'Agency' or 'Admin' would typically have access to getAllUsers/getUserById
// while a user can update/delete their own profile.

// Get all users (e.g., for Admin/Agency viewing their staff/individuals)
// This route would typically require 'Agency' or 'Admin' role
router.get('/', protect, authorizeRoles(['Agency', 'Admin']), getAllUsers);

// Get a single user by ID
// Users can get their own data, or Agencies can get their staff's data
router.get('/:id', protect, getUserById);

// Update user profile (e.g., individual updating their own info, agency updating staff info)
// A user can update their own profile, an agency can update their staff's profile
router.put('/:id', protect, updateUser);

// Delete user (e.g., user deleting their own account, agency deleting staff)
router.delete('/:id', protect, deleteUser);

// @route   GET /api/users/agency-staff
// @desc    Get all staff/individual users for the authenticated agency
// @access  Private (Agency only)
router.get('/agency-staff', protect, authorizeRoles(['Agency']), getAgencyStaff);

module.exports = router;