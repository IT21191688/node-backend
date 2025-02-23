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

}