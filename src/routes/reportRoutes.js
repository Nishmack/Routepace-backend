const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/dashboard", reportController.getDashboardStats);
router.get("/sales", reportController.getSalesReport);
router.get("/collections", reportController.getCollectionReport);
router.get("/routes", reportController.getRouteReport);

module.exports = router;
