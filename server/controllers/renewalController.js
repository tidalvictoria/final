const Renewal = require('../models/Renewal');
const User = require('../models/User'); // To get staff IDs for agency view
const Notification = require('../models/Notification'); // For renewal reminders

// @desc    Create a new renewal record
// @route   POST /api/renewals
// @access  Private (Agency, Admin)
const createRenewal = async (req, res) => {
    const { userId, itemType, itemName, currentExpirationDate, newExpirationDate, documentId, status, notes } = req.body;

    try {
        // Determine agencyId based on the authenticated user or the userId being created for
        let agencyId = null;
        const targetUser = await User.findById(userId);

        if (!targetUser) {
            return res.status(404).json({ message: 'Target user for renewal not found.' });
        }

        if (targetUser.role === 'Staff' && targetUser.agencyId) {
            agencyId = targetUser.agencyId;
        } else if (targetUser.role === 'Agency') {
            agencyId = targetUser._id;
        } else if (targetUser.role === 'Individual') {
            // Individual renewals don't typically have an agencyId
        }

        const newRenewal = await Renewal.create({
        userId,
        agencyId,
        itemType,
        itemName,
        currentExpirationDate: new Date(currentExpirationDate),
        newExpirationDate: newExpirationDate ? new Date(newExpirationDate) : null,
        documentId,
        status: status || 'Pending',
        notes,
        });

        res.status(201).json({ message: 'Renewal record created successfully', renewal: newRenewal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get upcoming renewals for the authenticated user or their agency's staff
// @route   GET /api/renewals/upcoming
// @access  Private
const getUpcomingRenewals = async (req, res) => {
    try {
        let query = {};
        const now = new Date();
        // Get renewals expiring within the next 90 days (example period)
        const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        if (req.user.role === 'Agency') {
        // Agency sees renewals for themselves and their staff
        const staffUserIds = await User.find({ agencyId: req.user._id }).select('_id');
        const allRelatedUserIds = [req.user._id, ...staffUserIds.map(id => id._id)];
        query = {
            userId: { $in: allRelatedUserIds },
            currentExpirationDate: { $gte: now, $lte: ninetyDaysLater },
            status: { $in: ['Pending', 'Notified'] } // Exclude 'Completed' ones
        };
        } else {
        // Staff/Individual sees their own upcoming renewals
        query = {
            userId: req.user._id,
            currentExpirationDate: { $gte: now, $lte: ninetyDaysLater },
            status: { $in: ['Pending', 'Notified'] }
        };
        }

        const renewals = await Renewal.find(query)
        .populate('userId', 'username email') // Populate user info for context
        .sort({ currentExpirationDate: 1 }) // Sort by soonest expiration
        .limit(5); // As per "shows next five dates" requirement

        res.status(200).json(renewals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single renewal by ID
// @route   GET /api/renewals/:id
// @access  Private
const getRenewalById = async (req, res) => {
    try {
        const renewal = await Renewal.findById(req.params.id).populate('userId', 'username email');

        if (!renewal) {
        return res.status(404).json({ message: 'Renewal record not found' });
        }

        // Authorization: User can view their own renewal OR Agency can view their staff's renewal
        if (renewal.userId.toString() === req.user._id.toString() ||
            (req.user.role === 'Agency' && renewal.agencyId && renewal.agencyId.toString() === req.user._id.toString())) {
        return res.status(200).json(renewal);
        } else {
        return res.status(403).json({ message: 'Not authorized to view this renewal record' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Renewal ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a renewal record
// @route   PUT /api/renewals/:id
// @access  Private
const updateRenewal = async (req, res) => {
    const { itemType, itemName, currentExpirationDate, newExpirationDate, documentId, status, notes, notificationSent } = req.body;

    try {
        let renewal = await Renewal.findById(req.params.id);

        if (!renewal) {
        return res.status(404).json({ message: 'Renewal record not found' });
        }

        // Authorization: User can update their own (limited fields) OR Agency can update their staff's
        if (renewal.userId.toString() === req.user._id.toString() ||
            (req.user.role === 'Agency' && renewal.agencyId && renewal.agencyId.toString() === req.user._id.toString())) {

        // Update fields
        renewal.itemType = itemType || renewal.itemType;
        renewal.itemName = itemName || renewal.itemName;
        renewal.currentExpirationDate = currentExpirationDate ? new Date(currentExpirationDate) : renewal.currentExpirationDate;
        renewal.newExpirationDate = newExpirationDate ? new Date(newExpirationDate) : renewal.newExpirationDate;
        renewal.documentId = documentId || renewal.documentId;
        renewal.status = status || renewal.status;
        renewal.notes = notes || renewal.notes;
        renewal.notificationSent = (notificationSent !== undefined) ? notificationSent : renewal.notificationSent;

        await renewal.save();
        res.status(200).json({ message: 'Renewal record updated successfully', renewal });
        } else {
        return res.status(403).json({ message: 'Not authorized to update this renewal record' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Renewal ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a renewal record
// @route   DELETE /api/renewals/:id
// @access  Private (Agency, Admin)
const deleteRenewal = async (req, res) => {
    try {
        const renewal = await Renewal.findById(req.params.id);

        if (!renewal) {
        return res.status(404).json({ message: 'Renewal record not found' });
        }

        // Authorization: Agency can delete their own renewals or staff's renewals
        if (req.user.role === 'Agency' && renewal.agencyId && renewal.agencyId.toString() === req.user._id.toString()) {
        await Renewal.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Renewal record deleted successfully' });
        } else if (req.user.role === 'Admin') { // Admin can delete any
            await Renewal.deleteOne({ _id: req.params.id });
            res.status(200).json({ message: 'Renewal record deleted successfully' });
        }
        else {
        return res.status(403).json({ message: 'Not authorized to delete this renewal record' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Renewal ID' });
        }
        res.status(500).json({ message: 'Server Error' });
  }
};


module.exports = {
    createRenewal,
    getUpcomingRenewals,
    getRenewalById,
    updateRenewal,
    deleteRenewal,
};