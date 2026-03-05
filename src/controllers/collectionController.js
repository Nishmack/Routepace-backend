const Collection = require("../models/Collection");
const Invoice = require("../models/Invoice");
const { AppError } = require("../middleware/errorHandler");

// ─── Get All Collections ──────────────────────────────────────────────────────
exports.getAllCollections = async (req, res, next) => {
  try {
    const { paymentMethod, collectedBy, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (collectedBy) filter.collectedBy = collectedBy;
    if (startDate || endDate) {
      filter.collectedAt = {};
      if (startDate) filter.collectedAt.$gte = new Date(startDate);
      if (endDate) filter.collectedAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [collections, total] = await Promise.all([
      Collection.find(filter)
        .populate("invoiceId", "invoiceNumber totalAmount")
        .populate("collectedBy", "name")
        .sort({ collectedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Collection.countDocuments(filter),
    ]);

    // Daily total
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyTotal = await Collection.aggregate([
      { $match: { user: req.user._id, collectedAt: { $gte: today }, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        collections,
        dailyTotal: dailyTotal[0]?.total || 0,
        pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Collection ────────────────────────────────────────────────────
exports.getCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findOne({ _id: req.params.id, user: req.user._id })
      .populate("invoiceId")
      .populate("collectedBy", "name");
    if (!collection) return next(new AppError("Collection not found.", 404));
    res.status(200).json({ success: true, data: { collection } });
  } catch (err) {
    next(err);
  }
};

// ─── Record a Collection ──────────────────────────────────────────────────────
exports.createCollection = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod, paymentReference, notes, upiDetails, chequeDetails } = req.body;

    // Validate invoice
    const invoice = await Invoice.findOne({ _id: invoiceId, user: req.user._id });
    if (!invoice) return next(new AppError("Invoice not found.", 404));
    if (invoice.status === "paid") return next(new AppError("Invoice is already fully paid.", 400));

    const collection = await Collection.create({
      user: req.user._id,
      invoiceId,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      collectedBy: req.user._id,
      amount,
      paymentMethod,
      paymentReference,
      notes,
      upiDetails,
      chequeDetails,
      isPartialPayment: amount < invoice.balanceDue,
    });

    // Update invoice payment
    invoice.paidAmount += amount;
    invoice.balanceDue = Math.max(0, invoice.totalAmount - invoice.paidAmount);

    if (invoice.balanceDue === 0) {
      invoice.status = "paid";
      invoice.paidDate = new Date();
    } else {
      invoice.status = "partially_paid";
    }

    await invoice.save();

    res.status(201).json({ success: true, data: { collection, invoice } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Collection Summary ───────────────────────────────────────────────────
exports.getCollectionSummary = async (req, res, next) => {
  try {
    const { period = "today" } = req.query;

    let startDate = new Date();
    if (period === "today") startDate.setHours(0, 0, 0, 0);
    else if (period === "week") startDate.setDate(startDate.getDate() - 7);
    else if (period === "month") startDate.setDate(1), startDate.setHours(0, 0, 0, 0);

    const summary = await Collection.aggregate([
      {
        $match: {
          user: req.user._id,
          status: "completed",
          collectedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalCollected = summary.reduce((sum, s) => sum + s.total, 0);
    const totalTransactions = summary.reduce((sum, s) => sum + s.count, 0);

    res.status(200).json({
      success: true,
      data: {
        period,
        totalCollected,
        totalTransactions,
        byPaymentMethod: summary,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Reverse a Collection ─────────────────────────────────────────────────────
exports.reverseCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findOne({ _id: req.params.id, user: req.user._id });
    if (!collection) return next(new AppError("Collection not found.", 404));
    if (collection.status === "reversed") return next(new AppError("Collection already reversed.", 400));

    collection.status = "reversed";
    await collection.save();

    // Reverse invoice payment
    const invoice = await Invoice.findById(collection.invoiceId);
    if (invoice) {
      invoice.paidAmount = Math.max(0, invoice.paidAmount - collection.amount);
      invoice.balanceDue = invoice.totalAmount - invoice.paidAmount;
      invoice.status = invoice.paidAmount === 0 ? "sent" : "partially_paid";
      await invoice.save();
    }

    res.status(200).json({ success: true, data: { collection } });
  } catch (err) {
    next(err);
  }
};
