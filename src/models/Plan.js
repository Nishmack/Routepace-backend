const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      enum: ["startup", "growing", "enterprise"],
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    pricing: {
      monthly: {
        amount: { type: Number, required: true }, // in cents
        currency: { type: String, default: "usd" },
        stripePriceId: { type: String },
      },
      yearly: {
        amount: { type: Number, required: true }, // in cents
        currency: { type: String, default: "usd" },
        stripePriceId: { type: String },
      },
    },
    features: [
      {
        name: { type: String, required: true },
        included: { type: Boolean, default: true },
        value: { type: String }, // e.g., "100 stops/month", "Unlimited"
      },
    ],
    limits: {
      stopsPerMonth: { type: Number, default: null }, // null = unlimited
      drivers: { type: Number, default: null },
      vehicles: { type: Number, default: null },
      warehouses: { type: Number, default: null },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isMostPopular: {
      type: Boolean,
      default: false,
    },
    trialDays: {
      type: Number,
      default: 14,
    },
    stripeProductId: {
      type: String,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: monthly price in dollars
planSchema.virtual("monthlyPriceFormatted").get(function () {
  return (this.pricing.monthly.amount / 100).toFixed(2);
});

// Virtual: yearly price in dollars
planSchema.virtual("yearlyPriceFormatted").get(function () {
  return (this.pricing.yearly.amount / 100).toFixed(2);
});

module.exports = mongoose.model("Plan", planSchema);
