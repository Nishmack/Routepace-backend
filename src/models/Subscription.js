const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "canceled", "incomplete", "paused"],
      default: "trialing",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    trialStart: Date,
    trialEnd: Date,
    canceledAt: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    // Stripe fields
    stripeSubscriptionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripeCustomerId: {
      type: String,
    },
    stripePaymentMethodId: {
      type: String,
    },
    // Usage tracking
    usage: {
      stopsThisMonth: { type: Number, default: 0 },
      activeDrivers: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

// Virtual: is subscription active
subscriptionSchema.virtual("isActive").get(function () {
  return ["active", "trialing"].includes(this.status);
});

// Virtual: days remaining
subscriptionSchema.virtual("daysRemaining").get(function () {
  const now = new Date();
  const end = new Date(this.currentPeriodEnd);
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
