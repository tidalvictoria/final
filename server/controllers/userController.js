const User = require('../models/User'); // Assuming you have the User model

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Agency/Admin)
const getAllUsers = async (req, res) => {
    try {
        // Agencies might only see users linked to their agency,
        // Admins might see all users. Adjust query based on req.user.role.
        let query = {};
        if (req.user.role === 'Agency') {
        // Find all Staff users whose agencyId matches the current Agency user's ID
        // Or find all Individual users associated somehow (less clear from doc)
        query = { agencyId: req.user._id }; // Assuming Agency users have an _id
        }

        const users = await User.find(query).select('-password'); // Exclude password from results
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
        return res.status(404).json({ message: 'User not found' });
        }

        // Authorization check:
        // User can get their own profile OR
        // Agency can get their staff's profile
        if (req.user._id.toString() === user._id.toString() ||
            (req.user.role === 'Agency' && user.agencyId && user.agencyId.toString() === req.user._id.toString())) {
        return res.status(200).json(user);
        } else {
        return res.status(403).json({ message: 'Not authorized to view this user profile' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid User ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
    const { username, email, contactNumber, address, licenses, isActive } = req.body; // Add fields as needed

    try {
        let user = await User.findById(req.params.id);

        if (!user) {
        return res.status(404).json({ message: 'User not found' });
        }

        // Authorization check:
        // User can update their own profile OR
        // Agency can update their staff's profile
        if (req.user._id.toString() === user._id.toString() ||
            (req.user.role === 'Agency' && user.agencyId && user.agencyId.toString() === req.user._id.toString())) {

        // Update fields
        user.username = username || user.username;
        user.email = email || user.email;
        user.contactNumber = contactNumber || user.contactNumber;
        user.address = address || user.address;
        // Handle licenses update carefully (e.g., if it's an array, you might need to merge/replace)
        if (licenses !== undefined) {
            user.licenses = licenses;
        }
        if (isActive !== undefined && req.user.role === 'Agency' && user.role === 'Staff') { // Only agency can activate/deactivate staff
            user.isActive = isActive;
        }


        // If email is changed, ensure it's unique (Mongoose unique validator helps)
        await user.save(); // Mongoose pre-save hooks will run (e.g., password hashing if changed)

        // Re-fetch to exclude password and send updated user
        user = await User.findById(req.params.id).select('-password');
        res.status(200).json({ message: 'User updated successfully', user });
        } else {
        return res.status(403).json({ message: 'Not authorized to update this user profile' });
        }
    } catch (error) {
        console.error(error);
        if (error.code === 11000) { // Duplicate key error (e.g., email already exists)
        return res.status(400).json({ message: 'Email or username already in use' });
        }
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid User ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
        return res.status(404).json({ message: 'User not found' });
        }

        // Authorization check:
        // User can delete their own account OR
        // Agency can delete their staff's account
        // Document says: "Will notify and be approved by agency before deletion" for Individuals.
        // This logic might need more complexity (e.g., a "pending deletion" status).
        if (req.user._id.toString() === user._id.toString() ||
            (req.user.role === 'Agency' && user.agencyId && user.agencyId.toString() === req.user._id.toString())) {

        await User.deleteOne({ _id: req.params.id }); // Using deleteOne for clarity

        // TODO: Implement "Will notify and be approved by agency before deletion" logic for Individual
        // This could involve setting a status like `user.status = 'pending_deletion_approval'`
        // and sending a notification to the agency. The actual deletion happens after approval.

        res.status(200).json({ message: 'User removed successfully' });
        } else {
        return res.status(403).json({ message: 'Not authorized to delete this user' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid User ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all staff/individual users associated with the authenticated agency
// @route   GET /api/users/agency-staff
// @access  Private (Agency only)
const getAgencyStaff = async (req, res) => {
    try {
        if (req.user.role !== 'Agency') {
            return res.status(403).json({ message: 'Only Agency users can view agency staff.' });
        }

        const agencyId = req.user._id;

        // Find all users (Staff or Individual) whose agencyId matches the authenticated agency's ID
        const staffMembers = await User.find({ agencyId: agencyId })
                                      .select('-password -__v -token -expiresAt'); // Exclude sensitive fields

        res.status(200).json(staffMembers);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching agency staff.' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getAgencyStaff
};