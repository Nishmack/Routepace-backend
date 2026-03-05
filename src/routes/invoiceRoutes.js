const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { protect } = require("../middleware/auth");
const { invoiceValidator } = require("../middleware/validators");

router.use(protect);

router.get("/", invoiceController.getAllInvoices);
router.post("/", invoiceValidator, invoiceController.createInvoice);

router.get("/:id", invoiceController.getInvoice);
router.patch("/:id", invoiceController.updateInvoice);
router.patch("/:id/void", invoiceController.voidInvoice);
router.post("/:id/send", invoiceController.sendInvoice);
router.post("/:id/payment", invoiceController.recordPayment);

module.exports = router;
