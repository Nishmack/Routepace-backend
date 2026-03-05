const express = require("express");
const router = express.Router();
const routeController = require("../controllers/routeController");
const { protect } = require("../middleware/auth");
const { routeValidator } = require("../middleware/validators");

router.use(protect);

router.get("/", routeController.getAllRoutes);
router.post("/", routeValidator, routeController.createRoute);
router.post("/sync", routeController.syncOfflineRoutes);

router.get("/:id", routeController.getRoute);
router.patch("/:id", routeController.updateRoute);
router.delete("/:id", routeController.deleteRoute);
router.patch("/:id/location", routeController.updateLocation);
router.patch("/:id/stops/:stopId", routeController.updateStopStatus);

module.exports = router;
