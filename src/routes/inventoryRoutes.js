const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { protect } = require("../middleware/auth");
const { inventoryValidator } = require("../middleware/validators");

router.use(protect);

router.get("/", inventoryController.getAllInventory);
router.post("/", inventoryValidator, inventoryController.createInventoryItem);
router.get("/low-stock", inventoryController.getLowStockItems);

router.get("/:id", inventoryController.getInventoryItem);
router.patch("/:id", inventoryController.updateInventoryItem);
router.delete("/:id", inventoryController.deleteInventoryItem);
router.post("/:id/adjust-stock", inventoryController.adjustStock);

module.exports = router;
