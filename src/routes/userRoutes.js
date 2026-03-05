const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect);

router.get("/profile", userController.getProfile);
router.patch("/profile", userController.updateProfile);

// Admin routes
router.use(restrictTo("admin"));
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.patch("/:id", userController.updateUser);
router.delete("/:id", userController.deactivateUser);

module.exports = router;
