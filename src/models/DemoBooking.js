const mongoose = require("mongoose");

const demoBookingSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    businessEmail: {
      type: String,
      required: [true, "Business email is required"],
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    businessType: {
      type: String,
      required: [true, "Business type is required"],
      trim: true,
    },
    numberOfDrivers: {
      type: String,
      default: "1-10",
    },
    specialRequirements: {
      type: String,
      trim: true,
      maxlength: [1000, "Special requirements cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "scheduled", "completed", "cancelled", "no_show"],
      default: "pending",
    },
    scheduledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ["homepage", "features_page", "pricing_page", "about_page", "organic", "paid_ads", "referral", "other"],
      default: "homepage",
    },
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    ipAddress: String,
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

demoBookingSchema.index({ businessEmail: 1 });
demoBookingSchema.index({ status: 1, createdAt: -1 });
demoBookingSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model("DemoBooking", demoBookingSchema);
