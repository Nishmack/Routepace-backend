const Invoice = require("../models/Invoice");
const Inventory = require("../models/Inventory");
const Collection = require("../models/Collection");
const { AppError } = require("../middleware/errorHandler");
const { sendEmail } = require("../utils/email");

// ─── Get All Invoices ─────────────────────────────────────────────────────────
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { status, customerId, page = 1, limit = 20, search, startDate, endDate } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Invoice.countDocuments(filter),
    ]);

    // Calculate totals
    const totals = await Invoice.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          paidAmount: { $sum: "$paidAmount" },
          pendingAmount: { $sum: "$balanceDue" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        invoices,
        totals: totals[0] || { totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
        pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Invoice ───────────────────────────────────────────────────────
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
      .populate("driver", "name phone");
    if (!invoice) return next(new AppError("Invoice not found.", 404));
    res.status(200).json({ success: true, data: { invoice } });
  } catch (err) {
    next(err);
  }
};

// ─── Create Invoice ───────────────────────────────────────────────────────────
exports.createInvoice = async (req, res, next) => {
  try {
    const { items, ...invoiceData } = req.body;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const lineTotal = item.quantity * item.unitPrice;
      const lineTax = lineTotal * ((item.taxRate || 0) / 100);
      const lineDiscount = item.discount || 0;
      const itemTotal = lineTotal + lineTax - lineDiscount;

      subtotal += lineTotal;
      taxAmount += lineTax;

      // Get product details if productId provided
      let productName = item.productName;
      let sku = item.sku;
      if (item.productId) {
        const product = await Inventory.findById(item.productId);
        if (product) {
          productName = product.productName;
          sku = product.sku;
        }
      }

      processedItems.push({ ...item, productName, sku, total: itemTotal });
    }

    const totalAmount = subtotal + taxAmount - (invoiceData.discountAmount || 0);

    const invoice = await Invoice.create({
      ...invoiceData,
      items: processedItems,
      subtotal,
      taxAmount,
      totalAmount,
      balanceDue: totalAmount,
      user: req.user._id,
      driver: req.user._id,
    });

    res.status(201).json({ success: true, data: { invoice } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Invoice ───────────────────────────────────────────────────────────
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!invoice) return next(new AppError("Invoice not found.", 404));
    res.status(200).json({ success: true, data: { invoice } });
  } catch (err) {
    next(err);
  }
};

// ─── Delete / Void Invoice ────────────────────────────────────────────────────
exports.voidInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: "void" },
      { new: true }
    );
    if (!invoice) return next(new AppError("Invoice not found.", 404));
    res.status(200).json({ success: true, data: { invoice } });
  } catch (err) {
    next(err);
  }
};

// ─── Send Invoice via WhatsApp / Email ────────────────────────────────────────
exports.sendInvoice = async (req, res, next) => {
  try {
    const { channel } = req.body; // "email" | "whatsapp"
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
    if (!invoice) return next(new AppError("Invoice not found.", 404));

    if (channel === "email" && invoice.customerEmail) {
      await sendEmail({
        to: invoice.customerEmail,
        subject: `Invoice ${invoice.invoiceNumber} from ${req.user.companyName}`,
        template: "invoice",
        data: { invoice, companyName: req.user.companyName },
      });
      invoice.deliveredVia.email = true;
      invoice.status = "sent";
      await invoice.save();
    }

    // WhatsApp integration would require WhatsApp Business API
    invoice.printCount += 1;
    await invoice.save();

    res.status(200).json({ success: true, message: `Invoice sent via ${channel}.`, data: { invoice } });
  } catch (err) {
    next(err);
  }
};

// ─── Record Payment on Invoice ────────────────────────────────────────────────
exports.recordPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
    if (!invoice) return next(new AppError("Invoice not found.", 404));

    invoice.paidAmount += amount;
    invoice.balanceDue = Math.max(0, invoice.totalAmount - invoice.paidAmount);

    if (invoice.balanceDue === 0) {
      invoice.status = "paid";
      invoice.paidDate = new Date();
    } else {
      invoice.status = "partially_paid";
    }

    await invoice.save();
    res.status(200).json({ success: true, data: { invoice } });
  } catch (err) {
    next(err);
  }
};
