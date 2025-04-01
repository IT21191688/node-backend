"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const wateringService_1 = require("../services/wateringService");
const deviceService_1 = require("../services/deviceService");
const firebase_1 = require("../config/firebase");
const notificationService_1 = require("../services/notificationService");
const location_1 = require("../models/location");
const device_1 = require("../models/device");
class ScheduleCron {
    constructor() {
        this.wateringService = new wateringService_1.WateringService();
        this.deviceService = new deviceService_1.DeviceService();
        this.initCronJobs();
    }
    initCronJobs() {
        node_cron_1.default.schedule("0 6 * * *", async () => {
            try {
                await this.wateringService.createDailySchedules();
            }
            catch (error) {
                console.error("Error in cron job:", error);
            }
        });
        node_cron_1.default.schedule("* * * * *", async () => {
            try {
                const result = await this.deviceService.updateDeviceBatteryLevels();
            }
            catch (error) {
                console.error("Error in battery update cron job:", error);
            }
        });
        node_cron_1.default.schedule("*/2 * * * *", async () => {
            console.log("Starting moisture level check...");
            try {
                await this.checkMoistureLevels();
                console.log("Moisture level check completed");
            }
            catch (error) {
                console.error("Error in moisture check cron job:", error);
            }
        });
    }
    async checkMoistureLevels() {
        try {
            const devices = await device_1.Device.find({
                isActive: true,
                status: "active",
            });
            console.log(`Checking moisture levels for ${devices.length} devices...`);
            for (const device of devices) {
                try {
                    if (device.type !== "soil_sensor")
                        continue;
                    const readings = await firebase_1.firebaseService.getSoilMoistureReadings(device.deviceId);
                    if (!readings) {
                        console.log(`No readings available for device ${device.deviceId}`);
                        continue;
                    }
                    const avgMoisture = (readings.moisture10cm +
                        readings.moisture20cm +
                        readings.moisture30cm) /
                        3;
                    if (avgMoisture < 30) {
                        console.log(`Low moisture detected for device ${device.deviceId}: ${avgMoisture.toFixed(1)}%`);
                        const location = await location_1.Location.findOne({
                            deviceId: device.deviceId,
                        });
                        const locationName = location ? location.name : "Unknown location";
                        await notificationService_1.notificationService.sendLowMoistureLevelNotifications(device.deviceId, locationName, Math.round(avgMoisture));
                        console.log(`Notification sent for device ${device.deviceId} at ${locationName}`);
                    }
                }
                catch (deviceError) {
                    console.error(`Error processing device ${device.deviceId}:`, deviceError);
                }
            }
        }
        catch (error) {
            console.error("Error in checkMoistureLevels:", error);
            throw error;
        }
    }
}
exports.ScheduleCron = ScheduleCron;
//# sourceMappingURL=sheduleCron.js.map