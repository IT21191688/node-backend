"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WateringService = void 0;
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = require("mongoose");
const wateringSchedule_1 = require("../models/wateringSchedule");
const location_1 = require("../models/location");
const errorHandler_1 = require("../middleware/errorHandler");
class WateringService {
    constructor() {
        this.weatherApiKey = "5dd16e6569f3cdae6509d32002b9dc67";
        this.mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:5000";
    }
    async getWeatherData(coordinates) {
        try {
            const response = await axios_1.default.get(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${this.weatherApiKey}&units=metric`);
            return {
                temperature: response.data.main.temp,
                humidity: response.data.main.humidity,
                rainfall: response.data.rain?.["1h"] || 0,
            };
        }
        catch (error) {
            throw new errorHandler_1.AppError(500, error);
        }
    }
    async getPrediction(data) {
        try {
            const response = await axios_1.default.post(`${this.mlServiceUrl}/api/irrigation/predict`, data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        }
        catch (error) {
            console.error("ML Service Error:", error.response?.data || error.message);
            throw new errorHandler_1.AppError(500, "Error getting prediction from ML service");
        }
    }
    getRecommendedAmount(prediction) {
        const ranges = {
            0: 0,
            1: 75,
            2: 40,
            3: 20,
        };
        return ranges[prediction];
    }
    async createSchedule(userId, locationId, data) {
        try {
            const location = await location_1.Location.findOne({
                _id: locationId,
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true,
            });
            if (!location) {
                throw new errorHandler_1.AppError(404, "Location not found");
            }
            const weatherData = await this.getWeatherData(location.coordinates);
            let soilData = data.soilConditions;
            soilData = {
                moisture10cm: 45.5,
                moisture20cm: 50.2,
                moisture30cm: 55.8,
            };
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
            const schedule = await wateringSchedule_1.WateringSchedule.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                locationId: new mongoose_1.Types.ObjectId(locationId),
                deviceId: location.deviceId,
                date: data.date || new Date(),
                weatherConditions: weatherData,
                soilConditions: {
                    ...soilData,
                    soilType: location.soilType,
                },
                plantAge: data.plantAge,
                recommendedAmount: this.getRecommendedAmount(mlPrediction.prediction),
                predictionConfidence: Math.max(mlPrediction.probabilities.noWater, mlPrediction.probabilities.highWater, mlPrediction.probabilities.moderateWater, mlPrediction.probabilities.lowWater) * 100,
            });
            return schedule;
        }
        catch (error) {
            console.log(error);
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(400, "Error creating watering schedule");
        }
    }
    async getScheduleHistory(userId, locationId, dateRange) {
        try {
            const query = {
                userId: new mongoose_1.Types.ObjectId(userId),
                deletedAt: null,
            };
            if (locationId) {
                query.locationId = new mongoose_1.Types.ObjectId(locationId);
            }
            if (dateRange) {
                query.date = {
                    $gte: dateRange.startDate,
                    $lte: dateRange.endDate,
                };
            }
            return await wateringSchedule_1.WateringSchedule.find(query)
                .populate("locationId")
                .sort({ date: -1 });
        }
        catch (error) {
            throw new errorHandler_1.AppError(500, "Error fetching schedule history");
        }
    }
    async updateScheduleStatus(scheduleId, userId, status, details) {
        try {
            const schedule = await wateringSchedule_1.WateringSchedule.findOneAndUpdate({
                _id: scheduleId,
                userId: new mongoose_1.Types.ObjectId(userId),
                deletedAt: null,
            }, {
                status,
                ...(details && { executionDetails: details }),
            }, { new: true });
            if (!schedule) {
                throw new errorHandler_1.AppError(404, "Schedule not found");
            }
            return schedule;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(400, "Error updating schedule status");
        }
    }
    async deleteSchedule(scheduleId, userId) {
        try {
            const schedule = await wateringSchedule_1.WateringSchedule.findOneAndUpdate({
                _id: scheduleId,
                userId: new mongoose_1.Types.ObjectId(userId),
                deletedAt: null,
            }, { deletedAt: new Date() }, { new: true });
            if (!schedule) {
                throw new errorHandler_1.AppError(404, "Schedule not found");
            }
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, "Error deleting schedule");
        }
    }
    async createDailySchedules() {
        try {
            const locations = await location_1.Location.find({ isActive: true });
            for (const location of locations) {
                try {
                    const weatherData = await this.getWeatherData(location.coordinates);
                    const soilData = {
                        moisture10cm: 45.5,
                        moisture20cm: 50.2,
                        moisture30cm: 55.8,
                    };
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
                    await wateringSchedule_1.WateringSchedule.create({
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
                        recommendedAmount: this.getRecommendedAmount(mlPrediction.prediction),
                        predictionConfidence: Math.max(mlPrediction.probabilities.noWater, mlPrediction.probabilities.highWater, mlPrediction.probabilities.moderateWater, mlPrediction.probabilities.lowWater) * 100,
                        status: "pending",
                    });
                    console.log(`Created schedule for location: ${location.name}`);
                }
                catch (error) {
                    console.error(`Error creating schedule for location ${location._id}:`, error);
                    continue;
                }
            }
        }
        catch (error) {
            console.error("Error in daily schedule creation:", error);
            throw new errorHandler_1.AppError(500, "Failed to create daily schedules");
        }
    }
    async getScheduleById(scheduleId, userId) {
        try {
            const schedule = await wateringSchedule_1.WateringSchedule.findOne({
                _id: new mongoose_1.Types.ObjectId(scheduleId),
                userId: new mongoose_1.Types.ObjectId(userId),
                deletedAt: null,
            }).populate("locationId");
            if (!schedule) {
                throw new errorHandler_1.AppError(404, "Schedule not found");
            }
            return schedule;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, "Error fetching schedule");
        }
    }
    calculatePlantAge(plantationDate) {
        const diffTime = Math.abs(Date.now() - new Date(plantationDate).getTime());
        const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
        return diffYears;
    }
}
exports.WateringService = WateringService;
//# sourceMappingURL=wateringService.js.map