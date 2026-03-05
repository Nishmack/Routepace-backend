const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    businessType: {
      type: String,
      enum: ["retailer", "wholesaler", "distributor", "hotel", "restaurant", "hospital", "pharmacy", "other"],
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    paymentTerms: {
      type: Number,
      default: 30, // days
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
    },
    beatDay: {
      type: [Number], // days of week 0-6
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    notes: String,
    // Sales stats
    stats: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      lastOrderDate: Date,
      averageOrderValue: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

customerSchema.index({ user: 1, name: 1 });
customerSchema.index({ user: 1, isActive: 1 });
customerSchema.index({ user: 1, "address.city": 1 });

// Virtual: outstanding balance
customerSchema.virtual("isOverdue").get(function () {
  return this.currentBalance > 0;
});

module.exports = mongoose.model("Customer", customerSchema);
