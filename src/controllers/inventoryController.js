const Inventory = require("../models/Inventory");
const { AppError } = require("../middleware/errorHandler");

// ─── Get All Inventory ────────────────────────────────────────────────────────
exports.getAllInventory = async (req, res, next) => {
  try {
    const { category, lowStock, search, page = 1, limit = 20, isActive = "true" } = req.query;

    const filter = { user: req.user._id };
    if (isActive !== "all") filter.isActive = isActive === "true";
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    let query = Inventory.find(filter).sort({ productName: 1 }).skip(skip).limit(Number(limit));

    let [items, total] = await Promise.all([query, Inventory.countDocuments(filter)]);

    // Filter low stock after fetch (virtual field)
    if (lowStock === "true") {
      items = items.filter((item) => item.isLowStock);
    }

    // Get categories for filter
    const categories = await Inventory.distinct("category", { user: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        items,
        categories,
        pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Item ──────────────────────────────────────────────────────────
exports.getInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return next(new AppError("Inventory item not found.", 404));
    res.status(200).json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
};

// ─── Create Item ──────────────────────────────────────────────────────────────
exports.createInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Item ──────────────────────────────────────────────────────────────
exports.updateInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return next(new AppError("Inventory item not found.", 404));
    res.status(200).json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Item ──────────────────────────────────────────────────────────────
exports.deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!item) return next(new AppError("Inventory item not found.", 404));
    res.status(204).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};

// ─── Adjust Stock ─────────────────────────────────────────────────────────────
exports.adjustStock = async (req, res, next) => {
  try {
    const { type, location, quantity, reason } = req.body;
    // type: "add" | "remove"
    // location: "warehouse" | "van"

    if (!["add", "remove"].includes(type)) {
      return next(new AppError("Type must be 'add' or 'remove'.", 400));
    }
    if (!["warehouse", "van"].includes(location)) {
      return next(new AppError("Location must be 'warehouse' or 'van'.", 400));
    }
    if (!quantity || quantity <= 0) {
      return next(new AppError("Quantity must be a positive number.", 400));
    }

    const item = await Inventory.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return next(new AppError("Inventory item not found.", 404));

    const delta = type === "add" ? quantity : -quantity;
    item.stock[location] = Math.max(0, (item.stock[location] || 0) + delta);
    item.stock.total = (item.stock.warehouse || 0) + (item.stock.van || 0);

    await item.save();
    res.status(200).json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Low Stock Items ──────────────────────────────────────────────────────
exports.getLowStockItems = async (req, res, next) => {
  try {
    const items = await Inventory.find({ user: req.user._id, isActive: true });
    const lowStockItems = items.filter((item) => item.isLowStock);

    res.status(200).json({ success: true, data: { items: lowStockItems, count: lowStockItems.length } });
  } catch (err) {
    next(err);
  }
};
