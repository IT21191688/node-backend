"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const locationController_1 = require("../controllers/locationController");
const auth_1 = require("../middleware/auth");
const locationDeviceValidation_1 = require("../middleware/locationDeviceValidation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
const locationController = new locationController_1.LocationController();
router.use(auth_1.authenticateJWT);
router.use(rateLimiter_1.rateLimiters.public);
router.post('/', locationDeviceValidation_1.validateLocation, locationController.createLocation);
router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocationById);
router.put('/:id', locationDeviceValidation_1.validateLocation, locationController.updateLocation);
router.delete('/:id', locationController.deleteLocation);
exports.default = router;
//# sourceMappingURL=locationRoutes.js.map