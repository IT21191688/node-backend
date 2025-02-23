import axios from 'axios';
import { Types } from 'mongoose';
import { CopraReading, ICopraReading } from '../models/copraReading';
import { AppError } from '../middleware/errorHandler';

interface WeatherData {
  temperature: number;
  humidity: number;
}

interface DryingPredictionInput {
  moistureLevel: number;
  temperature: number;
  humidity: number;
}

interface DryingTimeResponse {
  dryingTime: number;
  unit: string;
  inputFeatures: DryingPredictionInput;
}

interface BatchNoteUpdate {
  readingId: string;
  note: string;
}

export class CopraService {
  private readonly mlServiceUrl: string;
  private readonly weatherApiKey: string;

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000';
    this.weatherApiKey = process.env.WEATHER_API_KEY || '5dd16e6569f3cdae6509d32002b9dc67';
  }

  private async getWeatherData(coordinates: {
    latitude: number;
    longitude: number;
  }): Promise<WeatherData> {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${this.weatherApiKey}&units=metric`
      );

      return {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity
      };
    } catch (error: any) {
      throw new AppError(500, 'Error fetching weather data');
    }
  }

  async createReading(
    userId: string,
    data: Partial<ICopraReading> & { coordinates: { latitude: number; longitude: number } }
  ): Promise<{
    status: string;
    message: string;
    data: ICopraReading;
  }> {
    try {
      const weatherData = await this.getWeatherData(data.coordinates);
  
      const predictionResult = await this.predictDryingTime({
        moistureLevel: data.moistureLevel!,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity
      });
  
      const reading = await CopraReading.create({
        ...data,
        userId: new Types.ObjectId(userId),
        dryingTime: predictionResult.dryingTime,
        weatherConditions: {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity
        }
      });
  
      return {
        status: 'success',
        message: 'Copra reading created successfully',
        data: reading
      };
    } catch (error: any) {
      throw new AppError(400, `Error creating copra reading: ${error.message}`);
    }
  }

  private async predictDryingTime(data: DryingPredictionInput): Promise<DryingTimeResponse> {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/api/copra/predict-drying-time`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('ML Service Error:', error.response?.data || error.message);
      throw new AppError(500, 'Error getting drying time prediction from ML service');
    }
  }


}