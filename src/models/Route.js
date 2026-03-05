const mongoose = require("mongoose");

const stopSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  customerName: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  coordinates: {
    lat: Number,
    lng: Number,
  },
  sequence: { type: Number, required: true },
  estimatedArrival: Date,
  actualArrival: Date,
  status: {
    type: String,
    enum: ["pending", "en_route", "arrived", "completed", "skipped", "failed"],
    default: "pending",
  },
  notes: String,
  deliveryProof: {
    photoUrl: String,
    signatureUrl: String,
    capturedAt: Date,
  },
});

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Route name is required"],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedVehicle: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Route date is required"],
    },
    stops: [stopSchema],
    status: {
      type: String,
      enum: ["draft", "planned", "active", "completed", "cancelled"],
      default: "draft",
    },
    startTime: Date,
    endTime: Date,
    startLocation: {
      address: String,
      coordinates: { lat: Number, lng: Number },
    },
    endLocation: {
      address: String,
      coordinates: { lat: Number, lng: Number },
    },
    // Route optimization results
    optimization: {
      totalDistance: Number, // in km
      totalDuration: Number, // in minutes
      fuelEstimate: Number, // in liters
      optimizedAt: Date,
    },
    // Beat planning (AI route optimization)
    beatPlan: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "biweekly", "monthly"],
      },
      dayOfWeek: [Number], // 0-6 (Sun-Sat)
    },
    notes: {
      type: String,
      trim: true,
    },
    // GPS tracking
    currentLocation: {
      coordinates: { lat: Number, lng: Number },
      updatedAt: Date,
    },
    isOfflineSync: {
      type: Boolean,
      default: false,
    },
    syncedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

routeSchema.index({ user: 1, date: -1 });
routeSchema.index({ assignedDriver: 1, status: 1 });
routeSchema.index({ status: 1, date: 1 });

// Virtual: completed stops count
routeSchema.virtual("completedStops").get(function () {
  return this.stops.filter((s) => s.status === "completed").length;
});

// Virtual: completion percentage
routeSchema.virtual("completionPercentage").get(function () {
  if (this.stops.length === 0) return 0;
  return Math.round((this.completedStops / this.stops.length) * 100);
});

module.exports = mongoose.model("Route", routeSchema);
