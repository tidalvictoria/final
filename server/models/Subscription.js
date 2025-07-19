const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    userId: { // The user (Agency or Individual) who owns this subscription
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // A user should generally only have one active subscription
    },
    plan: {
        type: String,
        enum: ['Basic', 'Premium', 'Elite', 'None'], // 'None' for users without a paid plan
        required: true,
        default: 'None',
    },
    staffCountRange: { // Relevant for Agency plans
        type: String,
        enum: ['1-25', '25-50', '50+', null], // Matches the tier structure
        default: null,
    },
    stripeCustomerId: { // Stripe Customer ID for billing
        type: String,
        required: true,
        unique: true,
    },
    stripeSubscriptionId: { // Stripe Subscription ID
        type: String,
        unique: true,
        sparse: true, // Allows null values to be unique
    },
    status: { // Current status of the subscription from Stripe
        type: String,
        enum: ['active', 'past_due', 'canceled', 'trialing', 'incomplete', 'unpaid', 'ended', 'paused'],
        default: 'trialing', // Or 'active' if they pay immediately
    },
    currentPeriodStart: { // Start of the current billing period (from Stripe)
        type: Date,
        default: null,
    },
    currentPeriodEnd: { // End of the current billing period (from Stripe)
        type: Date,
        default: null,
    },
    cancelAtPeriodEnd: { // Whether the subscription is set to cancel at the end of the current period
        type: Boolean,
        default: false,
    },
    canceledAt: { // Timestamp if the subscription was canceled
        type: Date,
        default: null,
    },
    trialEnd: { // Trial end date
        type: Date,
        default: null,
    },
    startDate: { // When the user first started this subscription
        type: Date,
        default: Date.now,
    },
    // You might add priceId or productId if you have multiple products/prices per plan in Stripe
    stripePriceId: String,
    stripeProductId: String,
    lastPaymentDate: Date,
    nextPaymentAttempt: Date,
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Index to quickly find a subscription by user
SubscriptionSchema.index({ userId: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);