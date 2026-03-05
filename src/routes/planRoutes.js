const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");
const { protect, restrictTo } = require("../middleware/auth");

// Public routes
router.get("/", planController.getAllPlans);
router.get("/:id", planController.getPlan);

// Admin routes
router.use(protect, restrictTo("admin"));
router.post("/seed", planController.seedPlans);
router.post("/", planController.createPlan);
router.patch("/:id", planController.updatePlan);

module.exports = router;
