const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const crypto = require('crypto');
// Optional: If you want to use Nodemailer or similar for actual email sending, import it here.

// @desc    Send an invitation to a Staff or Individual user by an Agency (email only)
// @route   POST /api/invitations/send
// @access  Private (Agency only)
const sendInvitation = async (req, res) => {
    const agencyId = req.user._id;
    const { recipientEmail, message } = req.body; // Only recipientEmail is expected

    if (!recipientEmail) {
        return res.status(400).json({ message: 'Recipient email is required.' });
    }

    try {
        if (req.user.role !== 'Agency') {
            return res.status(403).json({ message: 'Only Agency users can send invitations.' });
        }

        let existingRecipientUser = null;
        // Find if a user with this email already exists
        existingRecipientUser = await User.findOne({ email: recipientEmail });

        if (existingRecipientUser) {
            // Check if the existing user is an Agency (cannot invite another agency)
            if (existingRecipientUser.role === 'Agency') {
                return res.status(400).json({ message: 'Cannot send invitation to another Agency user.' });
            }
            // Check if the existing user is already part of *this* agency
            if (existingRecipientUser.agencyId && existingRecipientUser.agencyId.toString() === agencyId.toString()) {
                return res.status(400).json({ message: 'User with this email is already part of this agency.' });
            }
            // Check if the existing user is already part of *another* agency
            if (existingRecipientUser.agencyId && existingRecipientUser.agencyId.toString() !== agencyId.toString()) {
                return res.status(400).json({ message: 'User with this email is already part of another agency.' });
            }
        }

        // Check if a pending invitation already exists for this agency and recipient email
        const existingPendingInvitation = await Invitation.findOne({
            agencyId,
            recipientEmail,
            status: 'Pending'
        });

        if (existingPendingInvitation) {
            return res.status(400).json({ message: 'A pending invitation to this email already exists from your agency.' });
        }

        // --- TEMPORARY DEBUG STEP: MANUALLY GENERATE TOKEN AND EXPIRY ---
        const generatedToken = crypto.randomBytes(32).toString('hex');
        const generatedExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        // --- END TEMPORARY DEBUG STEP ---

        // >>> DEBUG LOG: Check what values are generated RIGHT BEFORE CREATE <<<
        console.log(`DEBUG: Generated Token: ${generatedToken}`);
        console.log(`DEBUG: Generated Expires At: ${generatedExpiresAt}`);
        // >>> END DEBUG LOG <<<

        const newInvitation = await Invitation.create({
            agencyId,
            recipientEmail,
            recipientId: existingRecipientUser ? existingRecipientUser._id : null, // Link to user if they exist
            message,
            token: generatedToken,
            expiresAt: generatedExpiresAt
        });

        // --- IMPORTANT: This is where to integrate an email sending service (e.g., Nodemailer, SendGrid) ---
        // For testing purposes, you can just log the token:
        console.log(`Invitation sent to ${recipientEmail}. Token: ${newInvitation.token}`);
        // In a real app, you'd send an email with a link like:
        // `http://yourfrontend.com/accept-invite?token=${newInvitation.token}`
        // ---------------------------------------------------------------------------------------------------------

        res.status(201).json({
            message: 'Invitation sent successfully. Recipient will receive an email (or token displayed in console).',
            invitation: newInvitation
        });

    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error during invitation send.' });
    }
};

// @desc    Accept an invitation (by Staff/Individual user)
// @route   POST /api/invitations/accept
// @access  Private (Staff/Individual user)
const acceptInvitation = async (req, res) => {
    const { invitationToken } = req.body;
    const userId = req.user._id; // The user trying to accept the invitation

    if (!invitationToken) {
        return res.status(400).json({ message: 'Invitation token is required.' });
    }

    try {
        const invitation = await Invitation.findOne({ token: invitationToken });

        if (!invitation) {
            return res.status(404).json({ message: 'Invalid or expired invitation token.' });
        }

        if (invitation.status !== 'Pending') {
            return res.status(400).json({ message: `Invitation has already been ${invitation.status.toLowerCase()}.` });
        }

        if (invitation.expiresAt < new Date()) {
            invitation.status = 'Expired';
            await invitation.save();
            return res.status(400).json({ message: 'Invitation has expired.' });
        }

        const acceptingUser = await User.findById(userId);
        if (!acceptingUser) {
             return res.status(404).json({ message: 'Accepting user not found.' }); // Should not happen with protect middleware
        }

        // --- IMPORTANT AUTH CHECK FOR ACCEPTANCE ---
        // The accepting user's email MUST match the recipientEmail of the invitation
        if (acceptingUser.email !== invitation.recipientEmail) {
            return res.status(403).json({ message: 'Your email does not match the invited email for this token.' });
        }
        // If the invitation had a specific recipientId, the accepting user's ID must match it as well
        if (invitation.recipientId && invitation.recipientId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'This invitation was not intended for your user ID.' });
        }
        // ------------------------------------------

        // Prevent joining if already part of an agency (unless it's the same agency)
        if (acceptingUser.agencyId) {
            if (acceptingUser.agencyId.toString() === invitation.agencyId.toString()) {
                return res.status(400).json({ message: 'You are already part of this agency.' });
            } else {
                return res.status(400).json({ message: 'You are already part of another agency. Cannot join a new one.' });
            }
        }

        // Update the Staff/Individual user's agencyId
        acceptingUser.agencyId = invitation.agencyId;
        await acceptingUser.save();

        // Update the invitation status
        invitation.status = 'Accepted';
        invitation.acceptedAt = new Date();
        await invitation.save();

        // Optional: Notify the agency that the invitation has been accepted
        await Notification.create({
            userId: invitation.agencyId,
            type: 'invitation_accepted',
            message: `Invitation to ${acceptingUser.username || acceptingUser.email} has been accepted.`,
            // Consider adding a link to the user's profile or invitation details for the agency
        });

        res.status(200).json({ message: 'Invitation accepted successfully', user: acceptingUser });

    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid ID provided.' });
        }
        res.status(500).json({ message: 'Server Error during invitation acceptance.' });
    }
};

// @desc    Get all invitations sent by an Agency
// @route   GET /api/invitations/sent
// @access  Private (Agency only)
const getSentInvitations = async (req, res) => {
    try {
        if (req.user.role !== 'Agency') {
            return res.status(403).json({ message: 'Only Agency users can view sent invitations.' });
        }

        const invitations = await Invitation.find({ agencyId: req.user._id })
                                            .populate('recipientId', 'username email role') // Populate recipient info
                                            .sort({ createdAt: -1 });

        res.status(200).json(invitations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all pending invitations for a Staff/Individual user
// @route   GET /api/invitations/pending
// @access  Private (Staff/Individual only)
const getPendingInvitations = async (req, res) => {
    try {
        if (req.user.role === 'Agency') { // Agencies don't have pending invitations themselves
            return res.status(403).json({ message: 'Agency users do not have pending invitations.' });
        }

        // Find invitations where recipientId matches current user, or recipientEmail matches current user's email
        // and status is 'Pending' and not expired
        const invitations = await Invitation.find({
            $or: [
                { recipientId: req.user._id },
                { recipientEmail: req.user.email }
            ],
            status: 'Pending',
            expiresAt: { $gt: new Date() } // Not expired yet
        }).populate('agencyId', 'username email'); // Populate agency info

        res.status(200).json(invitations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Revoke an invitation (by Agency)
// @route   PUT /api/invitations/:id/revoke
// @access  Private (Agency only)
const revokeInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id);

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found.' });
        }

        // Ensure agency revoking is the one that sent it
        if (invitation.agencyId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to revoke this invitation.' });
        }

        if (invitation.status !== 'Pending') {
            return res.status(400).json({ message: `Invitation cannot be revoked. Current status: ${invitation.status}.` });
        }

        invitation.status = 'Rejected'; // Or 'Revoked' if you want a separate enum value
        await invitation.save();

        res.status(200).json({ message: 'Invitation revoked successfully', invitation });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Invitation ID.' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    sendInvitation,
    acceptInvitation,
    getSentInvitations,
    getPendingInvitations,
    revokeInvitation,
};