import { Router } from 'express';
import YieldPredictionController from '../controllers/YieldPredictionController';

const router = Router();

router.post('/yield-prediction', YieldPredictionController.createYieldPrediction);

export default router;