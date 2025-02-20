"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wateringController_1 = require("../controllers/wateringController");
const auth_1 = require("../middleware/auth");
const wateringValidation_1 = require("../middleware/wateringValidation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
const wateringController = new wateringController_1.WateringController();
router.use(auth_1.authenticateJWT);
router.use(rateLimiter_1.rateLimiters.public);
router.post('/schedule/:locationId', wateringValidation_1.validateWateringSchedule, wateringController.createSchedule);
router.get('/history', wateringValidation_1.validateDateRange, wateringController.getScheduleHistory);
router.get('/today', wateringController.getTodaySchedules);
router.get('/location/:locationId', wateringValidation_1.validateDateRange, wateringController.getLocationSchedules);
router.put('/schedule/:id/status', wateringController.updateScheduleStatus);
router.delete('/schedule/:id', wateringController.deleteSchedule);
router.get('/schedule/:id', wateringController.getScheduleById);
exports.default = router;
//# sourceMappingURL=wateringRoutes.js.map