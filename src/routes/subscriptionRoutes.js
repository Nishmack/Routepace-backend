const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { protect } = require("../middleware/auth");
const { subscriptionValidator } = require("../middleware/validators");

router.use(protect);

router.get("/me", subscriptionController.getMySubscription);
router.post("/checkout", subscriptionValidator, subscriptionController.createCheckoutSession);
router.post("/trial", subscriptionController.startFreeTrial);
router.post("/cancel", subscriptionController.cancelSubscription);
router.post("/reactivate", subscriptionController.reactivateSubscription);
router.get("/billing-portal", subscriptionController.getBillingPortal);

module.exports = router;
