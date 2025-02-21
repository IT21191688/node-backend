import { Request, Response } from 'express';
import YieldPredictionService from '../services/YieldPredictionService';

class YieldPredictionController {
  public async createYieldPrediction(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      const yieldPrediction = await YieldPredictionService.createYieldPrediction(data);
      res.status(201).json(yieldPrediction);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  }
}

export default new YieldPredictionController();