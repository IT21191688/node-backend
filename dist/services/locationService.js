"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const mongoose_1 = require("mongoose");
const location_1 = require("../models/location");
const device_1 = require("../models/device");
const errorHandler_1 = require("../middleware/errorHandler");
class LocationService {
    async createLocation(userId, data) {
        try {
            if (data.deviceId) {
                const device = await device_1.Device.findOne({
                    deviceId: data.deviceId,
                    userId: new mongoose_1.Types.ObjectId(userId),
                    isActive: true
                });
                if (!device) {
                    throw new errorHandler_1.AppError(404, 'Device not found');
                }
                const isDeviceAssigned = await location_1.Location.findOne({
                    deviceId: data.deviceId,
                    isActive: true
                });
                if (isDeviceAssigned) {
                    throw new errorHandler_1.AppError(400, 'Device is already assigned to another location');
                }
            }
            const location = await location_1.Location.create({
                ...data,
                userId: new mongoose_1.Types.ObjectId(userId)
            });
            if (data.deviceId) {
                await device_1.Device.findOneAndUpdate({ deviceId: data.deviceId }, { locationId: location._id });
            }
            return location;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(400, 'Error creating location');
        }
    }
    async getLocations(userId) {
        try {
            return await location_1.Location.find({
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            }).populate('deviceId');
        }
        catch (error) {
            throw new errorHandler_1.AppError(500, 'Error fetching locations');
        }
    }
    async getLocationById(locationId, userId) {
        try {
            const location = await location_1.Location.findOne({
                _id: locationId,
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            }).populate('deviceId');
            if (!location) {
                throw new errorHandler_1.AppError(404, 'Location not found');
            }
            return location;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, 'Error fetching location');
        }
    }
    async updateLocation(locationId, userId, data) {
        try {
            const location = await location_1.Location.findOneAndUpdate({
                _id: locationId,
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            }, data, { new: true, runValidators: true }).populate('deviceId');
            if (!location) {
                throw new errorHandler_1.AppError(404, 'Location not found');
            }
            return location;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(400, 'Error updating location');
        }
    }
    async deleteLocation(locationId, userId) {
        try {
            const location = await location_1.Location.findOneAndUpdate({
                _id: locationId,
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            }, { isActive: false }, { new: true });
            if (!location) {
                throw new errorHandler_1.AppError(404, 'Location not found');
            }
            if (location.deviceId) {
                await device_1.Device.findOneAndUpdate({ deviceId: location.deviceId }, { $unset: { locationId: 1 } });
            }
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, 'Error deleting location');
        }
    }
}
exports.LocationService = LocationService;
//# sourceMappingURL=locationService.js.map