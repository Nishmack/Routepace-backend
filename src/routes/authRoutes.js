const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { registerValidator, loginValidator } = require("../middleware/validators");

router.post("/register", registerValidator, authController.register);
router.post("/login", loginValidator, authController.login);
router.post("/logout", protect, authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.get("/me", protect, authController.getMe);
router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);
router.patch("/update-password", protect, authController.updatePassword);

module.exports = router;
