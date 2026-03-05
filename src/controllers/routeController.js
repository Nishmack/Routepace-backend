const Route = require("../models/Route");
const { AppError } = require("../middleware/errorHandler");

// ─── Get All Routes ───────────────────────────────────────────────────────────
exports.getAllRoutes = async (req, res, next) => {
  try {
    const { status, date, driverId, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (driverId) filter.assignedDriver = driverId;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [routes, total] = await Promise.all([
      Route.find(filter)
        .populate("assignedDriver", "name email phone")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Route.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        routes,
        pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Route ─────────────────────────────────────────────────────────
exports.getRoute = async (req, res, next) => {
  try {
    const route = await Route.findOne({ _id: req.params.id, user: req.user._id })
      .populate("assignedDriver", "name email phone");

    if (!route) return next(new AppError("Route not found.", 404));
    res.status(200).json({ success: true, data: { route } });
  } catch (err) {
    next(err);
  }
};

// ─── Create Route ─────────────────────────────────────────────────────────────
exports.createRoute = async (req, res, next) => {
  try {
    const routeData = { ...req.body, user: req.user._id };
    const route = await Route.create(routeData);

    res.status(201).json({ success: true, data: { route } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Route ─────────────────────────────────────────────────────────────
exports.updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!route) return next(new AppError("Route not found.", 404));
    res.status(200).json({ success: true, data: { route } });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Route ─────────────────────────────────────────────────────────────
exports.deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!route) return next(new AppError("Route not found.", 404));

    res.status(204).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};

// ─── Update Stop Status ───────────────────────────────────────────────────────
exports.updateStopStatus = async (req, res, next) => {
  try {
    const { stopId } = req.params;
    const { status, deliveryProof, notes, actualArrival } = req.body;

    const route = await Route.findOne({ _id: req.params.id, user: req.user._id });
    if (!route) return next(new AppError("Route not found.", 404));

    const stop = route.stops.id(stopId);
    if (!stop) return next(new AppError("Stop not found.", 404));

    stop.status = status;
    if (deliveryProof) stop.deliveryProof = { ...deliveryProof, capturedAt: new Date() };
    if (notes) stop.notes = notes;
    if (actualArrival) stop.actualArrival = new Date(actualArrival);

    // Check if all stops completed → auto-complete route
    const allCompleted = route.stops.every((s) => ["completed", "skipped"].includes(s.status));
    if (allCompleted) {
      route.status = "completed";
      route.endTime = new Date();
    }

    await route.save();
    res.status(200).json({ success: true, data: { route } });
  } catch (err) {
    next(err);
  }
};

// ─── Sync Offline Routes ──────────────────────────────────────────────────────
exports.syncOfflineRoutes = async (req, res, next) => {
  try {
    const { routes } = req.body;
    if (!Array.isArray(routes)) return next(new AppError("Routes array is required.", 400));

    const results = [];

    for (const routeData of routes) {
      const existing = await Route.findOne({ _id: routeData._id, user: req.user._id });
      if (existing) {
        // Merge offline changes
        Object.assign(existing, routeData, { isOfflineSync: true, syncedAt: new Date() });
        await existing.save();
        results.push({ id: routeData._id, synced: true });
      }
    }

    res.status(200).json({ success: true, message: `${results.length} routes synced.`, data: { results } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Driver GPS Location ───────────────────────────────────────────────
exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return next(new AppError("lat and lng are required.", 400));

    const route = await Route.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { currentLocation: { coordinates: { lat, lng }, updatedAt: new Date() } },
      { new: true }
    );

    if (!route) return next(new AppError("Route not found.", 404));
    res.status(200).json({ success: true, data: { location: route.currentLocation } });
  } catch (err) {
    next(err);
  }
};
