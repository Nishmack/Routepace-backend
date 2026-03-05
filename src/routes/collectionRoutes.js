const express = require("express");
const router = express.Router();
const collectionController = require("../controllers/collectionController");
const { protect } = require("../middleware/auth");
const { collectionValidator } = require("../middleware/validators");

router.use(protect);

router.get("/", collectionController.getAllCollections);
router.post("/", collectionValidator, collectionController.createCollection);
router.get("/summary", collectionController.getCollectionSummary);

router.get("/:id", collectionController.getCollection);
router.post("/:id/reverse", collectionController.reverseCollection);

module.exports = router;
