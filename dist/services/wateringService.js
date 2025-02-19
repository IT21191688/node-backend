"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WateringService = void 0;
const axios_1 = __importDefault(require("axios"));
const wateringSchedule_1 = require("../models/wateringSchedule");
const errorHandler_1 = require("../middleware/errorHandler");
const mongoose_1 = require("mongoose");
class WateringService {
    constructor() {
        this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    }
    async getPrediction(data) {
        try {
            const response = await axios_1.default.post(`${this.mlServiceUrl}/api/irrigation/predict`, data);
            return response.data;
        }
        catch (error) {
            throw new errorHandler_1.AppError(500, 'Error getting prediction from ML service');
        }
    }
    async createSchedule(userId, data) {
        try {
            const prediction = await this.getPrediction({
                soilType: data.soilConditions.soilType,
                soilMoisture10cm: data.soilConditions.moisture10cm,
                soilMoisture20cm: data.soilConditions.moisture20cm,
                soilMoisture30cm: data.soilConditions.moisture30cm,
                plantAge: data.plantAge,
                temperature: data.weatherConditions.temperature,
                humidity: data.weatherConditions.humidity,
                rainfall: data.weatherConditions.rainfall
            });
            const schedule = await wateringSchedule_1.WateringSchedule.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                date: data.date || new Date(),
                recommendedAmount: this.getRecommendedAmount(prediction.prediction),
                predictionConfidence: this.getHighestProbability(prediction.probabilities),
                ...data
            });
            return schedule;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(400, 'Error creating watering schedule');
        }
    }
    async getSchedules(userId, query = {}) {
        try {
            const { startDate, endDate, status } = query;
            const filter = { userId: new mongoose_1.Types.ObjectId(userId) };
            if (startDate || endDate) {
                filter.date = {};
                if (startDate)
                    filter.date.$gte = new Date(startDate);
                if (endDate)
                    filter.date.$lte = new Date(endDate);
            }
            if (status)
                filter.status = status;
            return await wateringSchedule_1.WateringSchedule.find(filter).sort({ date: -1 });
        }
        catch (error) {
            throw new errorHandler_1.AppError(500, 'Error fetching watering schedules');
        }
    }
    async updateSchedule(scheduleId, userId, data) {
        try {
            const schedule = await wateringSchedule_1.WateringSchedule.findOneAndUpdate({ _id: scheduleId, userId: new mongoose_1.Types.ObjectId(userId) }, data, { new: true, runValidators: true });
            if (!schedule) {
                throw new errorHandler_1.AppError(404, 'Watering schedule not found');
            }
            return schedule;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(400, 'Error updating watering schedule');
        }
    }
    async deleteSchedule(scheduleId, userId) {
        try {
            const schedule = await wateringSchedule_1.WateringSchedule.findOneAndDelete({
                _id: scheduleId,
                userId: new mongoose_1.Types.ObjectId(userId)
            });
            if (!schedule) {
                throw new errorHandler_1.AppError(404, 'Watering schedule not found');
            }
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, 'Error deleting watering schedule');
        }
    }
    async getScheduleById(scheduleId, userId) {
        try {
            const schedule = await wateringSchedule_1.WateringSchedule.findOne({
                _id: scheduleId,
                userId: new mongoose_1.Types.ObjectId(userId)
            });
            if (!schedule) {
                throw new errorHandler_1.AppError(404, 'Watering schedule not found');
            }
            return schedule;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, 'Error fetching watering schedule');
        }
    }
    getRecommendedAmount(prediction) {
        const ranges = {
            0: 0,
            1: 75,
            2: 40,
            3: 20
        };
        return ranges[prediction];
    }
    getHighestProbability(probabilities) {
        return Math.max(probabilities.noWater, probabilities.highWater, probabilities.moderateWater, probabilities.lowWater) * 100;
    }
}
exports.WateringService = WateringService;
//# sourceMappingURL=wateringService.js.map