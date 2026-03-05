const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// Note: raw body parsing is applied in app.js before this router
router.post("/stripe", webhookController.handleWebhook);

module.exports = router;
