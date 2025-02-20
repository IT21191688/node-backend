import axios from "axios";
import { Types } from "mongoose";
import {
  WateringSchedule,
  IWateringSchedule,
} from "../models/wateringSchedule";
import { Location } from "../models/location";
import { Device } from "../models/device";
import { AppError } from "../middleware/errorHandler";

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
}

interface MLPredictionResponse {
  prediction: number;
  probabilities: {
    noWater: number;
    highWater: number;
    moderateWater: number;
    lowWater: number;
  };
}

export class WateringService {
  private readonly weatherApiKey: string;
  private readonly mlServiceUrl: string;

  constructor() {
    this.weatherApiKey = "5dd16e6569f3cdae6509d32002b9dc67";
    this.mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:5000";
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
        humidity: response.data.main.humidity,
        rainfall: response.data.rain?.["1h"] || 0,
      };
    } catch (error: any) {
      throw new AppError(500, error);
    }
  }

  private async getPrediction(data: {
    soilType: string;
    soilMoisture10cm: number;
    soilMoisture20cm: number;
    soilMoisture30cm: number;
    plantAge: number;
    temperature: number;
    humidity: number;
    rainfall: number;
  }): Promise<MLPredictionResponse> {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/api/irrigation/predict`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("ML Service Error:", error.response?.data || error.message);
      throw new AppError(500, "Error getting prediction from ML service");
    }
  }

  private getRecommendedAmount(prediction: number): number {
    const ranges = {
      0: 0, // No water needed
      1: 75, // High water need (50-100L)
      2: 40, // Moderate water need (30-50L)
      3: 20, // Low water need (10-30L)
    };
    return ranges[prediction as keyof typeof ranges];
  }

  async createSchedule(
    userId: string,
    locationId: string,
    data: any
  ): Promise<IWateringSchedule> {
    try {
      const location = await Location.findOne({
        _id: locationId,
        userId: new Types.ObjectId(userId),
        isActive: true,
      });

      if (!location) {
        throw new AppError(404, "Location not found");
      }

      const weatherData = await this.getWeatherData(location.coordinates);

      let soilData = data.soilConditions;
      // if (location.deviceId) {
      //     const device = await Device.findOne({ deviceId: location.deviceId });
      //     if (device?.lastReading) {
      //         soilData = {
      //             moisture10cm: device.lastReading.moisture10cm,
      //             moisture20cm: device.lastReading.moisture20cm,
      //             moisture30cm: device.lastReading.moisture30cm
      //         };
      //     }
      // }

      soilData = {
        moisture10cm: 45.5, // Hardcoded test value
        moisture20cm: 50.2, // Hardcoded test value
        moisture30cm: 55.8, // Hardcoded test value
      };

      // Get prediction from ML service
      const mlPrediction = await this.getPrediction({
        soilType: location.soilType,
        soilMoisture10cm: soilData.moisture10cm,
        soilMoisture20cm: soilData.moisture20cm,
        soilMoisture30cm: soilData.moisture30cm,
        plantAge: this.calculatePlantAge(location.plantationDate),
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        rainfall: weatherData.rainfall,
      });

      const schedule = await WateringSchedule.create({
        userId: new Types.ObjectId(userId),
        locationId: new Types.ObjectId(locationId),
        deviceId: location.deviceId,
        date: data.date || new Date(),
        weatherConditions: weatherData,
        soilConditions: {
          ...soilData,
          soilType: location.soilType,
        },
        plantAge: data.plantAge,
        recommendedAmount: this.getRecommendedAmount(mlPrediction.prediction),
        predictionConfidence:
          Math.max(
            mlPrediction.probabilities.noWater,
            mlPrediction.probabilities.highWater,
            mlPrediction.probabilities.moderateWater,
            mlPrediction.probabilities.lowWater
          ) * 100,
      });

      return schedule;
    } catch (error) {
      console.log(error);
      if (error instanceof AppError) throw error;
      throw new AppError(400, "Error creating watering schedule");
    }
  }

  // Rest of the methods remain unchanged
  async getScheduleHistory(
    userId: string,
    locationId?: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<IWateringSchedule[]> {
    try {
      const query: any = {
        userId: new Types.ObjectId(userId),
        deletedAt: null,
      };

      if (locationId) {
        query.locationId = new Types.ObjectId(locationId);
      }

      if (dateRange) {
        query.date = {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        };
      }

      return await WateringSchedule.find(query)
        .populate("locationId")
        .sort({ date: -1 });
    } catch (error) {
      throw new AppError(500, "Error fetching schedule history");
    }
  }

  async updateScheduleStatus(
    scheduleId: string,
    userId: string,
    status: "completed" | "skipped" | "cancelled",
    details?: any
  ): Promise<IWateringSchedule> {
    try {
      const schedule = await WateringSchedule.findOneAndUpdate(
        {
          _id: scheduleId,
          userId: new Types.ObjectId(userId),
          deletedAt: null,
        },
        {
          status,
          ...(details && { executionDetails: details }),
        },
        { new: true }
      );

      if (!schedule) {
        throw new AppError(404, "Schedule not found");
      }

      return schedule;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(400, "Error updating schedule status");
    }
  }

  async deleteSchedule(scheduleId: string, userId: string): Promise<void> {
    try {
      const schedule = await WateringSchedule.findOneAndUpdate(
        {
          _id: scheduleId,
          userId: new Types.ObjectId(userId),
          deletedAt: null,
        },
        { deletedAt: new Date() },
        { new: true }
      );

      if (!schedule) {
        throw new AppError(404, "Schedule not found");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Error deleting schedule");
    }
  }

  async createDailySchedules(): Promise<void> {
    try {
      // Get all active locations
      const locations = await Location.find({ isActive: true });

      for (const location of locations) {
        try {
          const weatherData = await this.getWeatherData(location.coordinates);

          // Hardcoded soil moisture data
          const soilData = {
            moisture10cm: 45.5,
            moisture20cm: 50.2,
            moisture30cm: 55.8,
          };

          // Get prediction from ML service
          const mlPrediction = await this.getPrediction({
            soilType: location.soilType,
            soilMoisture10cm: soilData.moisture10cm,
            soilMoisture20cm: soilData.moisture20cm,
            soilMoisture30cm: soilData.moisture30cm,
            plantAge: this.calculatePlantAge(location.plantationDate),
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            rainfall: weatherData.rainfall,
          });

          // Create schedule for this location
          await WateringSchedule.create({
            userId: location.userId,
            locationId: location._id,
            deviceId: location.deviceId,
            date: new Date(),
            weatherConditions: weatherData,
            soilConditions: {
              ...soilData,
              soilType: location.soilType,
            },
            plantAge: this.calculatePlantAge(location.plantationDate),
            recommendedAmount: this.getRecommendedAmount(
              mlPrediction.prediction
            ),
            predictionConfidence:
              Math.max(
                mlPrediction.probabilities.noWater,
                mlPrediction.probabilities.highWater,
                mlPrediction.probabilities.moderateWater,
                mlPrediction.probabilities.lowWater
              ) * 100,
            status: "pending",
          });

          console.log(`Created schedule for location: ${location.name}`);
        } catch (error) {
          console.error(
            `Error creating schedule for location ${location._id}:`,
            error
          );
          // Continue with next location even if one fails
          continue;
        }
      }
    } catch (error) {
      console.error("Error in daily schedule creation:", error);
      throw new AppError(500, "Failed to create daily schedules");
    }
  }

  async getScheduleById(
    scheduleId: string,
    userId: string
  ): Promise<IWateringSchedule> {
    try {
      const schedule = await WateringSchedule.findOne({
        _id: new Types.ObjectId(scheduleId),
        userId: new Types.ObjectId(userId),
        deletedAt: null,
      }).populate("locationId");

      if (!schedule) {
        throw new AppError(404, "Schedule not found");
      }

      return schedule;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Error fetching schedule");
    }
  }

  private calculatePlantAge(plantationDate: Date): number {
    const diffTime = Math.abs(Date.now() - new Date(plantationDate).getTime());
    const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  }
}
