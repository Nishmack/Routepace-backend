const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      enum: ["piece", "kg", "gram", "liter", "ml", "box", "carton", "dozen", "pack", "bottle", "can", "other"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    costPrice: {
      type: Number,
      min: [0, "Cost price cannot be negative"],
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Stock across locations
    stock: {
      warehouse: { type: Number, default: 0 },
      van: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    reorderPoint: {
      type: Number,
      default: 20,
    },
    barcode: {
      type: String,
      trim: true,
    },
    imageUrl: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    supplier: {
      name: String,
      contactInfo: String,
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

inventorySchema.index({ user: 1, sku: 1 }, { unique: true });
inventorySchema.index({ user: 1, category: 1 });
inventorySchema.index({ user: 1, isActive: 1 });

// Pre-save: calculate total stock
inventorySchema.pre("save", function (next) {
  this.stock.total = (this.stock.warehouse || 0) + (this.stock.van || 0);
  next();
});

// Virtual: is low stock
inventorySchema.virtual("isLowStock").get(function () {
  return this.stock.total <= this.lowStockThreshold;
});

// Virtual: profit margin
inventorySchema.virtual("profitMargin").get(function () {
  if (!this.costPrice || this.costPrice === 0) return null;
  return (((this.price - this.costPrice) / this.price) * 100).toFixed(2);
});

module.exports = mongoose.model("Inventory", inventorySchema);
