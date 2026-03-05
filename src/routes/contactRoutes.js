// contactRoutes.js
const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const { protect, restrictTo } = require("../middleware/auth");
const { contactValidator } = require("../middleware/validators");

router.post("/", contactValidator, contactController.submitContact);

router.use(protect, restrictTo("admin"));
router.get("/", contactController.getAllContacts);
router.get("/:id", contactController.getContact);
router.patch("/:id", contactController.updateContact);

module.exports = router;
