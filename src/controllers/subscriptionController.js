const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const User = require("../models/User");
const { AppError } = require("../middleware/errorHandler");

// ─── Get My Subscription ──────────────────────────────────────────────────────
exports.getMySubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id })
      .populate("plan")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { subscription } });
  } catch (err) {
    next(err);
  }
};

// ─── Create Checkout Session ──────────────────────────────────────────────────
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { planId, billingCycle } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) return next(new AppError("Plan not found.", 404));
    if (plan.name === "enterprise") {
      return next(new AppError("Enterprise plan requires contacting sales.", 400));
    }

    const priceId =
      billingCycle === "yearly"
        ? plan.pricing.yearly.stripePriceId
        : plan.pricing.monthly.stripePriceId;

    if (!priceId) {
      return next(new AppError("Stripe price not configured for this plan.", 500));
    }

    // Get or create Stripe customer
    let stripeCustomerId = null;
    const existingSub = await Subscription.findOne({ user: req.user._id });
    if (existingSub?.stripeCustomerId) {
      stripeCustomerId = existingSub.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId: req.user._id.toString() },
      });
      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.CLIENT_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?subscription=cancelled`,
      subscription_data: {
        trial_period_days: plan.trialDays || undefined,
        metadata: { userId: req.user._id.toString(), planId: planId, billingCycle },
      },
      metadata: { userId: req.user._id.toString(), planId, billingCycle },
    });

    res.status(200).json({ success: true, data: { sessionId: session.id, url: session.url } });
  } catch (err) {
    next(err);
  }
};

// ─── Cancel Subscription ──────────────────────────────────────────────────────
exports.cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id, status: { $in: ["active", "trialing"] } });
    if (!subscription) return next(new AppError("No active subscription found.", 404));

    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    subscription.cancelAtPeriodEnd = true;
    subscription.canceledAt = new Date();
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription will be cancelled at the end of the current billing period.",
      data: { subscription },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Reactivate Subscription ──────────────────────────────────────────────────
exports.reactivateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id, cancelAtPeriodEnd: true });
    if (!subscription) return next(new AppError("No cancellation pending found.", 404));

    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
    }

    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = undefined;
    await subscription.save();

    res.status(200).json({ success: true, message: "Subscription reactivated.", data: { subscription } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Billing Portal ───────────────────────────────────────────────────────
exports.getBillingPortal = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });
    if (!subscription?.stripeCustomerId) {
      return next(new AppError("No billing account found.", 404));
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/dashboard/billing`,
    });

    res.status(200).json({ success: true, data: { url: session.url } });
  } catch (err) {
    next(err);
  }
};

// ─── Start Free Trial ─────────────────────────────────────────────────────────
exports.startFreeTrial = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) return next(new AppError("Plan not found.", 404));

    const existing = await Subscription.findOne({ user: req.user._id });
    if (existing) return next(new AppError("You already have a subscription.", 400));

    const now = new Date();
    const trialEnd = new Date(now.getTime() + (plan.trialDays || 14) * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      user: req.user._id,
      plan: plan._id,
      status: "trialing",
      billingCycle: "monthly",
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialStart: now,
      trialEnd: trialEnd,
    });

    await User.findByIdAndUpdate(req.user._id, { subscription: subscription._id });

    res.status(201).json({
      success: true,
      message: `Your ${plan.trialDays}-day free trial has started!`,
      data: { subscription },
    });
  } catch (err) {
    next(err);
  }
};
