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

  
  async getBatchHistory(userId: string, batchId: string): Promise<{
    status: string;
    message: string;
    data: ICopraReading[];
  }> {
    try {
      const readings = await CopraReading.find({
        userId: new Types.ObjectId(userId),
        batchId: batchId,
        deletedAt: null
      }).sort({ createdAt: -1 });
  
      if (!readings.length) {
        throw new AppError(404, 'No readings found for this batch');
      }
  
      return {
        status: 'success',
        message: 'Batch history retrieved successfully',
        data: readings
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error fetching batch history');
    }
  }

  async updateSingleNote(
    userId: string,
    batchId: string,
    id: string,
    note: string
  ): Promise<{
    status: string;
    message: string;
    data: ICopraReading | null;
  }> {
    try {
      const updatedReading = await CopraReading.findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
          batchId: batchId
        },
        { notes: note },
        { new: true }
      );
  
      if (!updatedReading) {
        throw new AppError(404, 'Reading not found');
      }
  
      return {
        status: 'success',
        message: 'Note updated successfully',
        data: updatedReading
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error updating note');
    }
  }

  //Delete a Batch of Readings
  async deleteBatchReadings(userId: string, batchId: string): Promise<{
    status: string;
    message: string;
  }> {
    try {
      const result = await CopraReading.deleteMany({
        userId: new Types.ObjectId(userId),
        batchId: batchId
      });
  
      if (!result.deletedCount) {
        throw new AppError(404, 'No readings found for this batch');
      }
  
      return {
        status: 'success',
        message: 'Batch readings deleted successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error deleting batch readings');
    }
  }

  async deleteSingleReading(
    userId: string,
    batchId: string,
    id: string
  ): Promise<{
    status: string;
    message: string;
  }> {
    try {
      const result = await CopraReading.findOneAndDelete({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
        batchId: batchId
      });
  
      if (!result) {
        throw new AppError(404, 'Reading not found');
      }
  
      return {
        status: 'success',
        message: 'Reading deleted successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error deleting reading');
    }
  }
  
  
  async getAllBatches(userId: string): Promise<{ batchId: string; readingsCount: number }[]> {
    try {
      const batches = await CopraReading.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            deletedAt: null,
            batchId: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: "$batchId",
            readingsCount: { $sum: 1 },
            lastUpdated: { $max: "$createdAt" }
          }
        },
        {
          $project: {
            batchId: "$_id",
            readingsCount: 1,
            lastUpdated: 1,
            _id: 0
          }
        },
        {
          $sort: { lastUpdated: -1 }
        }
      ]);
  
      return batches;
    } catch (error: any) {
      throw new AppError(500, 'Error fetching batches');
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