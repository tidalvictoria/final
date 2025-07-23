// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService'); // Already imported, good!

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { username, email, password, role, agencyId } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    try { // Add try-catch for database operation and email sending
        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role,
            agencyId: role === 'Staff' ? agencyId : null,
        });

        if (user) {
            // --- Send a welcome email ---
            const welcomeSubject = 'Welcome to HealthcareHR!';
            const welcomeText = `Hello ${username},\n\nWelcome to the Home HealthHR Portal! Your account has been successfully created.`;
            const welcomeHtml = `
                <p>Hello <strong>${username}</strong>,</p>
                <p>Welcome to the Home HealthHR Portal! Your account has been successfully created.</p>
                <p>You can now log in and start managing your HR needs.</p>
                <p>Best regards,<br/>The HealthcareHR Team</p>
            `;

            try {
                await sendEmail(email, welcomeSubject, welcomeText, welcomeHtml);
                console.log(`Welcome email sent to ${email}`);
            } catch (emailError) {
                console.error(`Failed to send welcome email to ${email}:`, emailError);
                // Decide how to handle email failure:
                // Option 1: Log and continue (user is still registered)
                // Option 2: Rollback user creation (more complex, requires transactions)
                // For now, we'll log and proceed with user registration success.
            }
            // --- End of email sending ---

            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        // Catch database errors during user creation
        console.error('Error during user registration:', error);
        res.status(500).json({ message: 'Server Error during registration' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
};