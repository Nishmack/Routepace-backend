const Contact = require("../models/Contact");
const { AppError } = require("../middleware/errorHandler");
const { sendEmail } = require("../utils/email");

// ─── Submit Contact Form ──────────────────────────────────────────────────────
exports.submitContact = async (req, res, next) => {
  try {
    const { fullName, companyName, businessEmail, phoneNumber, country, businessType, numberOfSalesmenDrivers, message } = req.body;

    const contact = await Contact.create({
      fullName,
      companyName,
      businessEmail,
      phoneNumber,
      country,
      businessType,
      numberOfSalesmenDrivers,
      message,
      ipAddress: req.ip,
    });

    // Auto-reply to user
    try {
      await sendEmail({
        to: businessEmail,
        subject: "We received your message - RoutePace",
        template: "contactAutoReply",
        data: { fullName },
      });
      contact.emailSent = true;
      await contact.save();
    } catch (emailErr) {
      console.error("Contact auto-reply failed:", emailErr.message);
    }

    try {
      await sendEmail({
        to: process.env.SUPPORT_EMAIL || "nishmack99@gmail.com",
        subject: `New Contact: ${fullName} from ${companyName}`,
        template: "newContactAlert",
        data: { fullName, companyName, businessEmail, phoneNumber, message },
      });
    } catch (err) {
      console.error("Contact alert email failed:", err.message);
    }

    res.status(201).json({
      success: true,
      message: "Your message has been sent! We'll get back to you within 24 hours.",
      data: { contact },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Contacts (Admin) ─────────────────────────────────────────────────
exports.getAllContacts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { businessEmail: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Contact.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        contacts,
        pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Contact ───────────────────────────────────────────────────────
exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return next(new AppError("Contact not found.", 404));
    res.status(200).json({ success: true, data: { contact } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Contact Status ────────────────────────────────────────────────────
exports.updateContact = async (req, res, next) => {
  try {
    const { status, internalNotes, assignedTo } = req.body;
    const contact = await Contact.findById(req.params.id);
    if (!contact) return next(new AppError("Contact not found.", 404));

    if (status) {
      contact.status = status;
      if (status === "resolved") contact.resolvedAt = new Date();
    }
    if (internalNotes !== undefined) contact.internalNotes = internalNotes;
    if (assignedTo) contact.assignedTo = assignedTo;

    await contact.save();
    res.status(200).json({ success: true, data: { contact } });
  } catch (err) {
    next(err);
  }
};
