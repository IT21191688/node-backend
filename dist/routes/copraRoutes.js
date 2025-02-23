"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const copraController_1 = require("../controllers/copraController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT);
router.use(rateLimiter_1.rateLimiters.public);
router.post('/readings', copraController_1.copraController.createReading);
router.get('/batches', copraController_1.copraController.getAllBatches);
router.get('/batch/:batchId', copraController_1.copraController.getBatchHistory);
router.put('/batch/:batchId/notes', copraController_1.copraController.updateBatchNotes);
router.delete('/batch/:batchId', copraController_1.copraController.deleteBatchReadings);
exports.default = router;
//# sourceMappingURL=copraRoutes.js.map