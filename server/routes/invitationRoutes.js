const express = require('express');
const router = express.Router();
const {
    sendInvitation, // Only Agency users can send invitations
    acceptInvitation,
    getSentInvitations, // Only Agency users can view sent invitations
    getPendingInvitations,
    revokeInvitation, // Only Agency users can revoke an invitation they sent
} = require('../controllers/invitationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Routes for managing invitations
router.post('/send', protect, authorizeRoles(['Agency']), sendInvitation);
router.post('/accept', protect, authorizeRoles(['Staff', 'Individual']), acceptInvitation);
router.get('/sent', protect, authorizeRoles(['Agency']), getSentInvitations);
router.get('/pending', protect, authorizeRoles(['Staff', 'Individual']), getPendingInvitations);
router.put('/:id/revoke', protect, authorizeRoles(['Agency']), revokeInvitation); // Expects invitation ID as param

module.exports = router;