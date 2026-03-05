const DemoBooking = require("../models/DemoBooking");
const { AppError } = require("../middleware/errorHandler");
const { sendEmail } = require("../utils/email");

// ─── Book a Demo ──────────────────────────────────────────────────────────────
exports.bookDemo = async (req, res, next) => {
  try {
    const {
      fullName,
      companyName,
      businessEmail,
      phoneNumber,
      country,
      businessType,
      numberOfDrivers,
      specialRequirements,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
    } = req.body;

    const booking = await DemoBooking.create({
      fullName,
      companyName,
      businessEmail,
      phoneNumber,
      country,
      businessType,
      numberOfDrivers,
      specialRequirements,
      source: source || "homepage",
      utmSource,
      utmMedium,
      utmCampaign,
      ipAddress: req.ip,
    });

    // Send confirmation email to prospect
    try {
      await sendEmail({
        to: businessEmail,
        subject: "Your RoutePace Demo is Confirmed!",
        template: "demoConfirmation",
        data: { fullName, companyName },
      });

      booking.emailSent = true;
      await booking.save();
    } catch (emailErr) {
      console.error("Demo confirmation email failed:", emailErr.message);
    }

    // Notify sales team
    try {
      await sendEmail({
        to: process.env.SALES_EMAIL || "nishmack99@gmail.com",
        subject: `New Demo Booking: ${companyName}`,
        template: "newDemoAlert",
        data: { fullName, companyName, businessEmail, phoneNumber, country, businessType, numberOfDrivers },
      });
    } catch (err) {
      console.error("Sales notification email failed:", err.message);
    }

    res.status(201).json({
      success: true,
      message: "Demo booked successfully! Our team will contact you within 24 hours.",
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Demo Bookings (Admin) ────────────────────────────────────────────
exports.getAllDemos = async (req, res, next) => {
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

    const [bookings, total] = await Promise.all([
      DemoBooking.find(filter).populate("assignedTo", "name email").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      DemoBooking.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Demo Booking ──────────────────────────────────────────────────
exports.getDemo = async (req, res, next) => {
  try {
    const booking = await DemoBooking.findById(req.params.id).populate("assignedTo", "name email");
    if (!booking) return next(new AppError("Demo booking not found.", 404));

    res.status(200).json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Demo Booking Status ───────────────────────────────────────────────
exports.updateDemo = async (req, res, next) => {
  try {
    const { status, scheduledAt, notes, assignedTo } = req.body;

    const booking = await DemoBooking.findById(req.params.id);
    if (!booking) return next(new AppError("Demo booking not found.", 404));

    if (status) booking.status = status;
    if (scheduledAt) booking.scheduledAt = new Date(scheduledAt);
    if (notes) booking.notes = notes;
    if (assignedTo) booking.assignedTo = assignedTo;
    if (status === "completed") booking.completedAt = new Date();

    await booking.save();

    res.status(200).json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Demo Stats (Admin) ───────────────────────────────────────────────────
exports.getDemoStats = async (req, res, next) => {
  try {
    const stats = await DemoBooking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = stats.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    const total = await DemoBooking.countDocuments();
    const thisMonth = await DemoBooking.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) },
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        thisMonth,
        byStatus: formattedStats,
      },
    });
  } catch (err) {
    next(err);
  }
};
