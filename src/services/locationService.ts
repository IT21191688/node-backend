// locationService.ts
import { Types } from 'mongoose';
import { Location, ILocation } from '../models/location';
import { Device } from '../models/device';
import { AppError } from '../middleware/errorHandler';

export class LocationService {
    async createLocation(
        userId: string, 
        data: Partial<ILocation> & { deviceId?: string }
    ): Promise<ILocation> {
        try {
            // Check if device exists and is available
            if (data.deviceId) {
                const device = await Device.findOne({ 
                    deviceId: data.deviceId,
                    userId: new Types.ObjectId(userId),
                    isActive: true
                });
                
                if (!device) {
                    throw new AppError(404, 'Device not found');
                }
                
                const isDeviceAssigned = await Location.findOne({ 
                    deviceId: data.deviceId,
                    isActive: true 
                });
                if (isDeviceAssigned) {
                    throw new AppError(400, 'Device is already assigned to another location');
                }
            }

            const location = await Location.create({
                ...data,
                userId: new Types.ObjectId(userId)
            });

            if (data.deviceId) {
                await Device.findOneAndUpdate(
                    { deviceId: data.deviceId },
                    { locationId: location._id }
                );
            }

            return location;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(400, 'Error creating location');
        }
    }

    async getLocations(userId: string): Promise<ILocation[]> {
        try {
            return await Location.find({ 
                userId: new Types.ObjectId(userId),
                isActive: true
            }).populate('deviceId');
        } catch (error) {
            throw new AppError(500, 'Error fetching locations');
        }
    }

    async getLocationById(locationId: string, userId: string): Promise<ILocation> {
        try {
            const location = await Location.findOne({
                _id: locationId,
                userId: new Types.ObjectId(userId),
                isActive: true
            }).populate('deviceId');

            if (!location) {
                throw new AppError(404, 'Location not found');
            }

            return location;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Error fetching location');
        }
    }

    async updateLocation(
        locationId: string, 
        userId: string, 
        data: Partial<ILocation>
    ): Promise<ILocation> {
        try {
            const location = await Location.findOneAndUpdate(
                { 
                    _id: locationId,
                    userId: new Types.ObjectId(userId),
                    isActive: true
                },
                data,
                { new: true, runValidators: true }
            ).populate('deviceId');

            if (!location) {
                throw new AppError(404, 'Location not found');
            }

            return location;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(400, 'Error updating location');
        }
    }

    async deleteLocation(locationId: string, userId: string): Promise<void> {
        try {
            const location = await Location.findOneAndUpdate(
                {
                    _id: locationId,
                    userId: new Types.ObjectId(userId),
                    isActive: true
                },
                { isActive: false },
                { new: true }
            );

            if (!location) {
                throw new AppError(404, 'Location not found');
            }

            // Unassign device if exists
            if (location.deviceId) {
                await Device.findOneAndUpdate(
                    { deviceId: location.deviceId },
                    { $unset: { locationId: 1 } }
                );
            }
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Error deleting location');
        }
    }
}