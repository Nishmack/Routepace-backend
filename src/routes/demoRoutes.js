const express = require("express");
const router = express.Router();
const demoController = require("../controllers/demoController");
const { protect, restrictTo } = require("../middleware/auth");
const { demoBookingValidator } = require("../middleware/validators");

// Public: Book a demo (from homepage & features page)
router.post("/", demoBookingValidator, demoController.bookDemo);

// Admin: Manage demo bookings
router.use(protect, restrictTo("admin"));
router.get("/", demoController.getAllDemos);
router.get("/stats", demoController.getDemoStats);
router.get("/:id", demoController.getDemo);
router.patch("/:id", demoController.updateDemo);

module.exports = router;
