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
                isActive: true,
            });
            if (existingDevice) {
                throw new errorHandler_1.AppError(400, "Device ID already exists");
            }
            const device = await device_1.Device.create({
                ...data,
                userId: new mongoose_1.Types.ObjectId(userId),
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
                isActive: true,
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
                isActive: true,
            });
            if (!device) {
                throw new errorHandler_1.AppError(404, "Device not found");
            }
            const location = await location_1.Location.findOne({
                deviceId: deviceId,
                isActive: true,
            }).select("name coordinates area soilType totalTrees status plantationDate description");
            const deviceData = device.toObject();
            return {
                ...deviceData,
                assignedLocation: location || null,
            };
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, "Error fetching device");
        }
    }
    async deleteDevice(deviceId, userId) {
        try {
            const device = await device_1.Device.findOneAndUpdate({
                deviceId: deviceId,
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true,
            }, { isActive: false }, { new: true });
            if (!device) {
                throw new errorHandler_1.AppError(404, "Device not found");
            }
            if (device.locationId) {
                await location_1.Location.findByIdAndUpdate(device.locationId, {
                    $unset: { deviceId: 1 },
                });
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
                    timestamp: new Date(),
                },
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
    async updateDevice(deviceId, userId, data) {
        try {
            const device = await device_1.Device.findOne({
                deviceId: deviceId,
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            });
            if (!device) {
                throw new errorHandler_1.AppError(404, "Device not found");
            }
            if ((data.status === 'inactive' || data.status === 'maintenance') && device.locationId) {
                throw new errorHandler_1.AppError(400, "Cannot change device status to inactive or maintenance while assigned to a location");
            }
            const updatedDevice = await device_1.Device.findOneAndUpdate({
                deviceId: deviceId,
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            }, data, { new: true, runValidators: true });
            return updatedDevice;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(400, "Error updating device");
        }
    }
}
exports.DeviceService = DeviceService;
//# sourceMappingURL=deviceService.js.map