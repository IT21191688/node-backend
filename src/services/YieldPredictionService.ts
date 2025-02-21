import axios from 'axios';
import YieldPrediction from '../models/YieldPrediction';

class YieldPredictionService {
  private predictionApiUrl = 'http://localhost:5000/predict';

  public async predictYield(data: any): Promise<number> {
    try {
      const response = await axios.post(this.predictionApiUrl, data);
      return response.data.predicted_yield;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Error predicting yield: ' + error.message);
      } else {
        throw new Error('Error predicting yield');
      }
    }
  }

  public async createYieldPrediction(data: any): Promise<any> {
    const predicted_yield = await this.predictYield(data);
    const yieldPrediction = new YieldPrediction({ ...data, predicted_yield });
    await yieldPrediction.save();
    return yieldPrediction;
  }
}

export default new YieldPredictionService();