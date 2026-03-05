const Invoice = require("../models/Invoice");
const Collection = require("../models/Collection");
const Route = require("../models/Route");
const Inventory = require("../models/Inventory");
const { AppError } = require("../middleware/errorHandler");

// ─── Dashboard Overview ───────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      dailyCollections,
      monthlyCollections,
      lastMonthCollections,
      totalInvoices,
      overdueInvoices,
      activeRoutes,
      todayRoutes,
      lowStockItems,
    ] = await Promise.all([
      // Daily collections
      Collection.aggregate([
        { $match: { user: userId, collectedAt: { $gte: today }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      // Monthly collections
      Collection.aggregate([
        { $match: { user: userId, collectedAt: { $gte: thisMonthStart }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Last month collections
      Collection.aggregate([
        { $match: { user: userId, collectedAt: { $gte: lastMonthStart, $lte: lastMonthEnd }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Invoice counts
      Invoice.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$totalAmount" } } },
      ]),
      // Overdue invoices
      Invoice.countDocuments({ user: userId, status: { $nin: ["paid", "void", "cancelled"] }, dueDate: { $lt: new Date() } }),
      // Active routes
      Route.countDocuments({ user: userId, status: "active" }),
      // Today routes
      Route.countDocuments({ user: userId, date: { $gte: today } }),
      // Low stock
      Inventory.find({ user: userId, isActive: true }),
    ]);

    const dailyTotal = dailyCollections[0]?.total || 0;
    const monthlyTotal = monthlyCollections[0]?.total || 0;
    const lastMonthTotal = lastMonthCollections[0]?.total || 0;
    const collectionGrowth = lastMonthTotal > 0 ? (((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1) : 0;

    const invoiceStats = totalInvoices.reduce((acc, s) => { acc[s._id] = s; return acc; }, {});
    const lowStockCount = lowStockItems.filter((i) => i.isLowStock).length;

    res.status(200).json({
      success: true,
      data: {
        collections: {
          today: dailyTotal,
          todayCount: dailyCollections[0]?.count || 0,
          thisMonth: monthlyTotal,
          lastMonth: lastMonthTotal,
          growthPercent: collectionGrowth,
        },
        invoices: {
          byStatus: invoiceStats,
          overdue: overdueInvoices,
        },
        routes: {
          active: activeRoutes,
          today: todayRoutes,
        },
        inventory: {
          lowStock: lowStockCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Sales Performance Report ─────────────────────────────────────────────────
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const groupFormat =
      groupBy === "month" ? { year: { $year: "$issueDate" }, month: { $month: "$issueDate" } }
      : groupBy === "week" ? { year: { $year: "$issueDate" }, week: { $week: "$issueDate" } }
      : { year: { $year: "$issueDate" }, month: { $month: "$issueDate" }, day: { $dayOfMonth: "$issueDate" } };

    const salesData = await Invoice.aggregate([
      { $match: { user: req.user._id, issueDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: "$totalAmount" },
          totalCollected: { $sum: "$paidAmount" },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Top products
    const topProducts = await Invoice.aggregate([
      { $match: { user: req.user._id, issueDate: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productName",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: { salesData, topProducts, period: { start, end } },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Collection Report ────────────────────────────────────────────────────────
exports.getCollectionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const [byMethod, byDriver, daily] = await Promise.all([
      Collection.aggregate([
        { $match: { user: req.user._id, collectedAt: { $gte: start, $lte: end }, status: "completed" } },
        { $group: { _id: "$paymentMethod", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Collection.aggregate([
        { $match: { user: req.user._id, collectedAt: { $gte: start, $lte: end }, status: "completed" } },
        {
          $group: {
            _id: "$collectedBy",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "driver" } },
        { $unwind: "$driver" },
        { $project: { total: 1, count: 1, driverName: "$driver.name" } },
        { $sort: { total: -1 } },
      ]),
      Collection.aggregate([
        { $match: { user: req.user._id, collectedAt: { $gte: start, $lte: end }, status: "completed" } },
        {
          $group: {
            _id: {
              year: { $year: "$collectedAt" },
              month: { $month: "$collectedAt" },
              day: { $dayOfMonth: "$collectedAt" },
            },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),
    ]);

    const grandTotal = byMethod.reduce((sum, m) => sum + m.total, 0);

    res.status(200).json({
      success: true,
      data: { grandTotal, byMethod, byDriver, daily, period: { start, end } },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Route Performance Report ─────────────────────────────────────────────────
exports.getRouteReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const routes = await Route.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
      status: { $in: ["completed", "active"] },
    }).populate("assignedDriver", "name");

    const summary = {
      totalRoutes: routes.length,
      completedRoutes: routes.filter((r) => r.status === "completed").length,
      totalStops: routes.reduce((sum, r) => sum + r.stops.length, 0),
      completedStops: routes.reduce((sum, r) => sum + r.stops.filter((s) => s.status === "completed").length, 0),
      avgCompletionRate: 0,
    };

    summary.avgCompletionRate =
      summary.totalStops > 0
        ? ((summary.completedStops / summary.totalStops) * 100).toFixed(1)
        : 0;

    res.status(200).json({
      success: true,
      data: { summary, routes, period: { start, end } },
    });
  } catch (err) {
    next(err);
  }
};
