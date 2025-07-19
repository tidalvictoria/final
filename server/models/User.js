const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false, // Don't return password by default on queries
    },
    role: {
        type: String,
        enum: ['Agency', 'Staff', 'Individual'],
        required: true,
    },
    agencyId: { // For Staff users, references their Agency
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model itself
        default: null,
    },
    // Basic subscription info (can be expanded into a separate Subscription model)
    subscription: {
        plan: {
        type: String,
        enum: ['Basic', 'Premium', 'Elite', 'None'],
        default: 'None',
        },
        stripeCustomerId: String, // Stripe customer ID
        stripeSubscriptionId: String, // Stripe subscription ID
        status: {
        type: String,
        enum: ['active', 'past_due', 'canceled', 'trialing', 'incomplete', 'unpaid', 'ended'],
        default: 'trialing', // Or 'active' for paying customers
        },
        startDate: Date,
        endDate: Date,
    },
    // Other user-specific details
    contactNumber: String,
    address: String,
    isActive: {
        type: Boolean,
        default: true,
    },
    // Fields specific to Staff/Individual if not handled by a separate schema/discriminator
    licenses: [{
    name: String,
    expirationDate: Date,
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' } // Link to uploaded license document
    }],
  // ... other relevant fields as per requirements
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Password hashing middleware
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserSchema = new mongoose.Schema({
//     username: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ['Agency', 'Staff', 'Individual'], default: 'Individual' },
//     agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // For staff
//     // Add other fields like name, contact info, subscription details etc.
//     }, { timestamps: true });

//     UserSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) {
//         next();
//     }
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//     });

//     UserSchema.methods.matchPassword = async function (enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model('User', UserSchema);