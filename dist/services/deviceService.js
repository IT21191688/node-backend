"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceService = void 0;
const mongoose_1 = require("mongoose");
const device_1 = require("../models/device");
const location_1 = require("../models/location");
const errorHandler_1 = require("../middleware/errorHandler");
class DeviceService {
    async registerDevice(userId, data) {
        try {
            const existingDevice = await device_1.Device.findOne({
                deviceId: data.deviceId,
                isActive: true
            });
            if (existingDevice) {
                throw new errorHandler_1.AppError(400, "Device ID already exists");
            }
            const device = await device_1.Device.create({
                ...data,
                userId: new mongoose_1.Types.ObjectId(userId)
            });
            return device;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(400, "Error registering device");
        }
    }
    async getDevices(userId) {
        try {
            return await device_1.Device.find({
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            }).populate("locationId", "name coordinates");
        }
        catch (error) {
            throw new errorHandler_1.AppError(500, "Error fetching devices");
        }
    }
    async getDeviceById(deviceId, userId) {
        try {
            const device = await device_1.Device.findOne({
                deviceId: deviceId,
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            }).populate("locationId", "name coordinates");
            if (!device) {
                throw new errorHandler_1.AppError(404, "Device not found");
            }
            return device;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, "Error fetching device");
        }
    }
    async updateDevice(deviceId, userId, data) {
        try {
            const device = await device_1.Device.findOneAndUpdate({
                deviceId: deviceId,
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            }, data, { new: true, runValidators: true });
            if (!device) {
                throw new errorHandler_1.AppError(404, "Device not found");
            }
            return device;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(400, "Error updating device");
        }
    }
    async deleteDevice(deviceId, userId) {
        try {
            const device = await device_1.Device.findOneAndUpdate({
                deviceId: deviceId,
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            }, { isActive: false }, { new: true });
            if (!device) {
                throw new errorHandler_1.AppError(404, "Device not found");
            }
            if (device.locationId) {
                await location_1.Location.findByIdAndUpdate(device.locationId, { $unset: { deviceId: 1 } });
            }
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, "Error deleting device");
        }
    }
    async updateDeviceReading(deviceId, reading) {
        try {
            const device = await device_1.Device.findOneAndUpdate({ deviceId, isActive: true }, {
                lastReading: {
                    ...reading,
                    timestamp: new Date()
                }
            }, { new: true });
            if (!device) {
                throw new errorHandler_1.AppError(404, "Device not found");
            }
            return device;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(400, "Error updating device reading");
        }
    }
}
exports.DeviceService = DeviceService;
//# sourceMappingURL=deviceService.js.map