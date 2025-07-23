const mongoose = require('mongoose');

const subscriberSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      unique: true, // Ensure no duplicate emails
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    // You could add more fields, e.g., source, timestamp
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Subscriber', subscriberSchema);
