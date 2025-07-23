subscriberController.js
const Subscriber = require('../models/Subscriber');

// @desc    Add a new email to the launch list
// @route   POST /api/subscribe
// @access  Public
const addSubscriber = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please enter an email address.' });
  }

  try {
    // Check if email already exists
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(409).json({ message: 'This email is already on our launch list! We\'ll notify you soon.' });
    }

    const newSubscriber = await Subscriber.create({ email });

    res.status(201).json({
      message: 'Thanks for your interest! We\'ll notify you when we launch!',
      subscriber: {
        _id: newSubscriber._id,
        email: newSubscriber.email,
      },
    });
  } catch (error) {
    console.error('Error adding subscriber:', error);
    // Handle validation errors specifically (e.g., invalid email format from schema match)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error. Could not add your email at this time.' });
  }
};

module.exports = {
  addSubscriber,
};
