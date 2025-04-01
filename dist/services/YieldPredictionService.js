"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const YieldPrediction_1 = __importDefault(require("../models/YieldPrediction"));
const wateringService_1 = require("../services/wateringService");
const location_1 = require("../models/location");
class YieldPredictionService {
    constructor() {
        this.predictionApiUrl = 'https://flask-be-deploy.onrender.com/predict';
    }
    async predictYield(data) {
        try {
            const response = await axios_1.default.post(this.predictionApiUrl, data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error('Error predicting yield: ' + error.message);
            }
            else {
                throw new Error('Error predicting yield');
            }
        }
    }
    async createYieldPrediction(data, userId, locationId) {
        try {
            const location = await location_1.Location.findOne({ _id: locationId });
            const wateringService = new wateringService_1.WateringService();
            if (!location || !location.deviceId) {
                throw new Error('Location not found or device ID not available');
            }
            let moistureSensorData = await wateringService.getSoilMoistureData(location.deviceId);
            console.log("Moisture sensor data:", moistureSensorData);
            if (moistureSensorData && data.monthly_data && data.monthly_data.length > 0) {
                data.monthly_data[0].sm_10 = moistureSensorData.moisture10cm;
                data.monthly_data[0].sm_20 = moistureSensorData.moisture20cm;
                data.monthly_data[0].sm_30 = moistureSensorData.moisture30cm;
            }
            const predictionData = { ...data };
            console.log("Predict yield data:", data);
            const predictionResponse = await this.predictYield(predictionData);
            const yieldPrediction = new YieldPrediction_1.default({
                ...predictionResponse,
                user: userId,
                location: locationId,
            });
            await yieldPrediction.save();
            return yieldPrediction;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error('Error creating yield prediction: ' + error.message);
            }
            else {
                throw new Error('Error creating yield prediction');
            }
        }
    }
    async getAllYieldPredictions() {
        return YieldPrediction_1.default.find();
    }
    async getYieldPredictionById(id) {
        return YieldPrediction_1.default.findById(id);
    }
    async getYieldPredictionsByUser(userId) {
        return YieldPrediction_1.default.find({ user: userId });
    }
    async deleteYieldPrediction(id) {
        return YieldPrediction_1.default.deleteOne({ _id: id });
    }
    async getLatestYieldPredictionByUser(userId) {
        return YieldPrediction_1.default.findOne({ user: userId }).sort({ createdAt: -1 });
    }
}
exports.default = new YieldPredictionService();
//# sourceMappingURL=YieldPredictionService.js.map