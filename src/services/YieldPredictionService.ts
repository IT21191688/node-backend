import axios from 'axios';
import YieldPrediction from '../models/YieldPrediction';
import logger from '../utils/logger';
import { WateringService } from '../services/wateringService';
import { Location } from "../models/location";


class YieldPredictionService {
  private predictionApiUrl = 'https://flask-be-deploy.onrender.com/predict';

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

  public async createYieldPrediction(data: any, userId: string, locationId: string): Promise<any> {
    try {
      // Create an instance of WateringService and fetch soil moisture data
      const location = await Location.findOne({ _id: locationId});
      const wateringService = new WateringService();
      
      if (!location || !location.deviceId) {
        throw new Error('Location not found or device ID not available');
      }
      
      let moistureSensorData = await wateringService.getSoilMoistureData(location.deviceId);

      // Log the retrieved moisture sensor data
      console.log("Moisture sensor data:", moistureSensorData);

      // Update soil moisture values if moistureSensorData is available
      if (moistureSensorData && data.monthly_data && data.monthly_data.length > 0) {
        data.monthly_data[0].sm_10 = moistureSensorData.moisture10cm;
        data.monthly_data[0].sm_20 = moistureSensorData.moisture20cm;
        data.monthly_data[0].sm_30 = moistureSensorData.moisture30cm;
      }

      // Add moisture sensor data to the prediction data
      const predictionData = { ...data };

      // Log the complete prediction data
      console.log("Predict yield data:", data);

      const predictionResponse = await this.predictYield(predictionData);
      const yieldPrediction = new YieldPrediction({
        ...predictionResponse,
        user: userId,
        location: locationId,
      });
      await yieldPrediction.save();
      return yieldPrediction;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Error creating yield prediction: ' + error.message);
      } else {
        throw new Error('Error creating yield prediction');
      }
    }
  }

  public async getAllYieldPredictions(): Promise<any> {
    return YieldPrediction.find();
  }

  public async getYieldPredictionById(id: string): Promise<any> {
    return YieldPrediction.findById(id);
  }

  public async getYieldPredictionsByUser(userId: string): Promise<any> {
    return YieldPrediction.find({ user: userId });
  }

  public async deleteYieldPrediction(id: string): Promise<any> {
    return YieldPrediction.deleteOne({ _id: id });
  }

  public async getLatestYieldPredictionByUser(userId: string): Promise<any> {
    return YieldPrediction.findOne({ user: userId }).sort({ createdAt: -1 });
  }
}

export default new YieldPredictionService();