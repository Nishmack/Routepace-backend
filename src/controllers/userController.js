const User = require("../models/User");
const { AppError } = require("../middleware/errorHandler");

// ─── Get My Profile ───────────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("subscription");
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// ─── Update My Profile ────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, country, companyName, businessType, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, country, companyName, businessType, avatar },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Users (Admin) ────────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate("subscription")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single User (Admin) ──────────────────────────────────────────────────
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("subscription");
    if (!user) return next(new AppError("User not found.", 404));
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// ─── Update User (Admin) ──────────────────────────────────────────────────────
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isActive },
      { new: true, runValidators: true }
    );

    if (!user) return next(new AppError("User not found.", 404));
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// ─── Deactivate User (Admin) ──────────────────────────────────────────────────
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return next(new AppError("User not found.", 404));
    res.status(200).json({ success: true, message: "User deactivated.", data: { user } });
  } catch (err) {
    next(err);
  }
};
