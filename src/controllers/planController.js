const Plan = require("../models/Plan");
const { AppError } = require("../middleware/errorHandler");

// ─── Get All Plans (Public) ───────────────────────────────────────────────────
exports.getAllPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort("sortOrder");
    res.status(200).json({ success: true, data: { plans } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Plan ──────────────────────────────────────────────────────────
exports.getPlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return next(new AppError("Plan not found.", 404));
    res.status(200).json({ success: true, data: { plan } });
  } catch (err) {
    next(err);
  }
};

// ─── Create Plan (Admin) ──────────────────────────────────────────────────────
exports.createPlan = async (req, res, next) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json({ success: true, data: { plan } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Plan (Admin) ──────────────────────────────────────────────────────
exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) return next(new AppError("Plan not found.", 404));
    res.status(200).json({ success: true, data: { plan } });
  } catch (err) {
    next(err);
  }
};

// ─── Seed Default Plans ───────────────────────────────────────────────────────
exports.seedPlans = async (req, res, next) => {
  try {
    const existing = await Plan.countDocuments();
    if (existing > 0) {
      return res.status(200).json({ success: true, message: "Plans already seeded." });
    }

    const defaultPlans = [
      {
        name: "startup",
        displayName: "STARTUP",
        description: "Perfect for individual couriers and local startups getting off the ground.",
        pricing: {
          monthly: { amount: 2900 },
          yearly: { amount: 2320 },
        },
        features: [
          { name: "Basic route optimization", included: true },
          { name: "Stops per month", included: true, value: "100" },
          { name: "Mobile app access", included: true },
          { name: "Standard email support", included: true },
          { name: "Daily route history", included: true },
          { name: "Unlimited stops", included: false },
          { name: "Real-time driver tracking", included: false },
          { name: "SMS notifications", included: false },
        ],
        limits: { stopsPerMonth: 100, drivers: 3 },
        trialDays: 0,
        isMostPopular: false,
        sortOrder: 1,
      },
      {
        name: "growing",
        displayName: "GROWING",
        description: "Our most robust plan for scaling delivery teams and logistics businesses.",
        pricing: {
          monthly: { amount: 7900 },
          yearly: { amount: 6320 },
        },
        features: [
          { name: "Everything in Startup", included: true },
          { name: "Unlimited stops per month", included: true },
          { name: "Real-time driver tracking", included: true },
          { name: "Automated SMS notifications", included: true },
          { name: "Priority 24/7 support", included: true },
          { name: "Proof of delivery (Photo/Sign)", included: true },
        ],
        limits: { stopsPerMonth: null, drivers: null },
        trialDays: 14,
        isMostPopular: true,
        sortOrder: 2,
      },
      {
        name: "enterprise",
        displayName: "ENTERPRISE",
        description: "Tailored solutions for large fleets, freight forwarders, and logistics enterprises.",
        pricing: {
          monthly: { amount: 0 },
          yearly: { amount: 0 },
        },
        features: [
          { name: "Everything in Growing", included: true },
          { name: "Full API & Webhook access", included: true },
          { name: "Single Sign-On (SSO/SAML)", included: true },
          { name: "Dedicated Account Manager", included: true },
          { name: "Custom reporting & BI sync", included: true },
          { name: "White-labeled mobile app", included: true },
        ],
        limits: { stopsPerMonth: null, drivers: null, vehicles: null, warehouses: null },
        trialDays: 0,
        isMostPopular: false,
        sortOrder: 3,
      },
    ];

    await Plan.insertMany(defaultPlans);
    const plans = await Plan.find().sort("sortOrder");

    res.status(201).json({ success: true, message: "Plans seeded successfully.", data: { plans } });
  } catch (err) {
    next(err);
  }
};
