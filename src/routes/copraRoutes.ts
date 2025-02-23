import { Router } from 'express';
import { copraController } from '../controllers/copraController';
import { authenticateJWT } from "../middleware/auth";
import { rateLimiters } from "../middleware/rateLimiter";

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Apply rate limiting
router.use(rateLimiters.public);

// New batch-related routes
router.post('/readings', copraController.createReading);
router.get('/batches', copraController.getAllBatches);
router.get('/batch/:batchId', copraController.getBatchHistory);
router.put('/batch/:batchId/notes', copraController.updateBatchNotes);
router.delete('/batch/:batchId', copraController.deleteBatchReadings);
router.delete('/batch/:batchId/:id', copraController.deleteSingleReading);


export default router;