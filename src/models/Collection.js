const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
      required: true,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "cheque", "bank_transfer", "upi", "card", "other"],
    },
    paymentReference: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "reversed"],
      default: "completed",
    },
    collectedAt: {
      type: Date,
      default: Date.now,
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
    },
    isPartialPayment: {
      type: Boolean,
      default: false,
    },
    notes: String,
    // UPI/digital payment details
    upiDetails: {
      transactionId: String,
      upiId: String,
    },
    // Cheque details
    chequeDetails: {
      chequeNumber: String,
      bankName: String,
      chequeDate: Date,
    },
    // Offline sync flag
    isOfflineSync: {
      type: Boolean,
      default: false,
    },
    syncedAt: Date,
    // Ledger tracking
    ledgerEntry: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

collectionSchema.index({ user: 1, collectedAt: -1 });
collectionSchema.index({ invoiceId: 1 });
collectionSchema.index({ customerId: 1, collectedAt: -1 });
collectionSchema.index({ collectedBy: 1, collectedAt: -1 });

module.exports = mongoose.model("Collection", collectionSchema);
