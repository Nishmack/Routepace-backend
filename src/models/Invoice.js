const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
  },
  productName: { type: String, required: true },
  sku: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: { type: String, required: true },
    customerEmail: String,
    customerPhone: String,
    customerAddress: String,
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: function () {
        return this.totalAmount;
      },
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled", "void"],
      default: "draft",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: Date,
    notes: String,
    termsAndConditions: String,
    // WhatsApp/SMS delivery
    deliveredVia: {
      whatsapp: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
    printCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, dueDate: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customerId: 1, createdAt: -1 });

// Auto-generate invoice number
invoiceSchema.pre("validate", async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model("Invoice").countDocuments({ user: this.user });
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Virtual: is overdue
invoiceSchema.virtual("isOverdue").get(function () {
  return this.status !== "paid" && new Date() > new Date(this.dueDate);
});

// Virtual: days overdue
invoiceSchema.virtual("daysOverdue").get(function () {
  if (!this.isOverdue) return 0;
  const diff = new Date() - new Date(this.dueDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model("Invoice", invoiceSchema);
