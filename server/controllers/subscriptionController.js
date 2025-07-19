const Subscription = require('../models/Subscription');
const User = require('../models/User'); // To update user with stripeCustomerId, etc.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Initialize Stripe

// @desc    Create a new subscription record (after successful Stripe checkout)
// @route   POST /api/subscriptions
// @access  Private
const createSubscription = async (req, res) => {
    const { userId, plan, staffCountRange, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd, trialEnd, stripePriceId, stripeProductId } = req.body;

    try {
        // Check if a subscription already exists for this user
        const existingSubscription = await Subscription.findOne({ userId });
        if (existingSubscription) {
        return res.status(400).json({ message: 'User already has an active subscription record.' });
        }

        const newSubscription = await Subscription.create({
        userId,
        plan,
        staffCountRange,
        stripeCustomerId,
        stripeSubscriptionId,
        status: status || 'trialing',
        currentPeriodStart: new Date(), // Assuming creation means start of period or trial
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
        trialEnd: trialEnd ? new Date(trialEnd) : null,
        stripePriceId,
        stripeProductId,
        });

        // Optionally update the User model with stripeCustomerId
        await User.findByIdAndUpdate(userId, {
        'subscription.plan': plan,
        'subscription.stripeCustomerId': stripeCustomerId,
        'subscription.stripeSubscriptionId': stripeSubscriptionId,
        'subscription.status': status || 'trialing',
        // Add other subscription fields to user if needed
        });


        res.status(201).json({ message: 'Subscription record created successfully', subscription: newSubscription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get authenticated user's subscription details
// @route   GET /api/subscriptions/me
// @access  Private
const getSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.user._id });

        if (!subscription) {
        return res.status(404).json({ message: 'No subscription found for this user.' });
        }

        res.status(200).json(subscription);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update subscription details (e.g., plan change, staff count)
// @route   PUT /api/subscriptions/:id
// @access  Private (Can be called by user for self-updates or by admin)
const updateSubscription = async (req, res) => {
    const { plan, staffCountRange, status, currentPeriodEnd, cancelAtPeriodEnd, canceledAt, trialEnd, stripePriceId, stripeProductId } = req.body;

    try {
        let subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
        }

        // Authorization: User can update their own subscription
        // Or an Admin could update any subscription
        if (subscription.userId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Not authorized to update this subscription' });
        }

        // Update fields
        subscription.plan = plan || subscription.plan;
        subscription.staffCountRange = staffCountRange || subscription.staffCountRange;
        subscription.status = status || subscription.status;
        subscription.currentPeriodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : subscription.currentPeriodEnd;
        subscription.cancelAtPeriodEnd = (cancelAtPeriodEnd !== undefined) ? cancelAtPeriodEnd : subscription.cancelAtPeriodEnd;
        subscription.canceledAt = canceledAt ? new Date(canceledAt) : subscription.canceledAt;
        subscription.trialEnd = trialEnd ? new Date(trialEnd) : subscription.trialEnd;
        subscription.stripePriceId = stripePriceId || subscription.stripePriceId;
        subscription.stripeProductId = stripeProductId || subscription.stripeProductId;

        await subscription.save();

        // Optionally update the User model
        await User.findByIdAndUpdate(subscription.userId, {
        'subscription.plan': subscription.plan,
        'subscription.status': subscription.status,
        });

        res.status(200).json({ message: 'Subscription updated successfully', subscription });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Subscription ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Cancel a subscription via Stripe API
// @route   POST /api/subscriptions/:id/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
    try {
        const subscriptionRecord = await Subscription.findById(req.params.id);

        if (!subscriptionRecord) {
        return res.status(404).json({ message: 'Subscription record not found' });
        }

        // Authorization
        if (subscriptionRecord.userId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Not authorized to cancel this subscription' });
        }

        if (!subscriptionRecord.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No Stripe subscription ID found for this record.' });
        }

        // Call Stripe API to cancel the subscription
        const stripeSubscription = await stripe.subscriptions.cancel(
        subscriptionRecord.stripeSubscriptionId
        );

        // Update your database record based on Stripe's response
        subscriptionRecord.status = stripeSubscription.status; // Should become 'canceled' or 'ended'
        subscriptionRecord.canceledAt = new Date();
        subscriptionRecord.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
        await subscriptionRecord.save();

        // Update user model as well
        await User.findByIdAndUpdate(subscriptionRecord.userId, {
        'subscription.status': stripeSubscription.status,
        'subscription.cancelAtPeriodEnd': stripeSubscription.cancel_at_period_end,
        'subscription.canceledAt': new Date(),
        });

        res.status(200).json({ message: 'Subscription canceled successfully', subscription: subscriptionRecord });

    } catch (error) {
        console.error('Stripe cancellation error:', error);
        res.status(500).json({ message: 'Failed to cancel subscription via Stripe.', error: error.message });
    }
};

// (Optional) Typically would have a separate webhook handler for Stripe events
// that automatically updates subscription statuses (e.g., from trialing to active, or from active to past_due)
// This handler would NOT be exposed through /api/subscriptions, but via a dedicated /stripe-webhook endpoint.
/*
const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`⚠️  Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'customer.subscription.updated':
            const subscription = event.data.object;
            // Update your Subscription model based on the subscription object
            console.log(`Subscription updated: ${subscription.id}`);
            // Find your subscription record by stripeSubscriptionId and update its status, period ends, etc.
            break;
        case 'customer.subscription.deleted':
            const deletedSubscription = event.data.object;
            console.log(`Subscription deleted: ${deletedSubscription.id}`);
            // Mark your subscription record as canceled/deleted in your DB
            break;
        // ... handle other events
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};
*/

module.exports = {
    createSubscription,
    getSubscription,
    updateSubscription,
    cancelSubscription,
  // handleStripeWebhook,
};