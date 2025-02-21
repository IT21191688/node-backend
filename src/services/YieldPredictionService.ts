import axios from 'axios';
import YieldPrediction from '../models/YieldPrediction';

class YieldPredictionService {
  private predictionApiUrl = 'http://127.0.0.1:5000/predict';

  public async predictYield(data: any): Promise<any> {
    try {
      const response = await axios.post(this.predictionApiUrl, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Error predicting yield: ' + error.message);
      } else {
        throw new Error('Error predicting yield');
      }
    }
  }

  public async createYieldPrediction(data: any): Promise<any> {
    const predictionResponse = await this.predictYield(data);
    const yieldPrediction = new YieldPrediction(predictionResponse);
    await yieldPrediction.save();
    return yieldPrediction;
  }
}

export default new YieldPredictionService();