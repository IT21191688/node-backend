import { Types } from "mongoose";
import { Device, IDevice } from "../models/device";
import { Location } from "../models/location";
import { AppError } from "../middleware/errorHandler";

export class DeviceService {
  async registerDevice(
    userId: string,
    data: Partial<IDevice>
  ): Promise<IDevice> {
    try {
      // Check if device ID is unique
      const existingDevice = await Device.findOne({
        deviceId: data.deviceId,
        isActive: true,
      });

      if (existingDevice) {
        throw new AppError(400, "Device ID already exists");
      }

      const device = await Device.create({
        ...data,
        userId: new Types.ObjectId(userId),
      });

      return device;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(400, "Error registering device");
    }
  }

  async getDevices(userId: string): Promise<IDevice[]> {
    try {
      return await Device.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      }).populate("locationId", "name coordinates");
    } catch (error) {
      throw new AppError(500, "Error fetching devices");
    }
  }

  // async getDeviceById(deviceId: string, userId: string): Promise<IDevice> {
  //     try {
  //         const device = await Device.findOne({
  //             deviceId: deviceId,
  //             userId: new Types.ObjectId(userId),
  //             isActive: true
  //         }).populate("locationId", "name coordinates");

  //         if (!device) {
  //             throw new AppError(404, "Device not found");
  //         }

  //         return device;
  //     } catch (error) {
  //         if (error instanceof AppError) throw error;
  //         throw new AppError(500, "Error fetching device");
  //     }
  // }

  async getDeviceById(deviceId: string, userId: string): Promise<any> {
    try {
      // Find the device
      const device = await Device.findOne({
        deviceId: deviceId,
        userId: new Types.ObjectId(userId),
        isActive: true,
      });

      if (!device) {
        throw new AppError(404, "Device not found");
      }

      // Find associated location
      const location = await Location.findOne({
        deviceId: deviceId,
        isActive: true,
      }).select(
        "name coordinates area soilType totalTrees status plantationDate description"
      );

      // Return device with location details
      const deviceData = device.toObject();
      return {
        ...deviceData,
        assignedLocation: location || null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Error fetching device");
    }
  }

  async updateDevice(
    deviceId: string,
    userId: string,
    data: Partial<IDevice>
  ): Promise<IDevice> {
    try {
      const device = await Device.findOneAndUpdate(
        {
          deviceId: deviceId,
          userId: new Types.ObjectId(userId),
          isActive: true,
        },
        data,
        { new: true, runValidators: true }
      );

      if (!device) {
        throw new AppError(404, "Device not found");
      }

      return device;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(400, "Error updating device");
    }
  }

  async deleteDevice(deviceId: string, userId: string): Promise<void> {
    try {
      const device = await Device.findOneAndUpdate(
        {
          deviceId: deviceId,
          userId: new Types.ObjectId(userId),
          isActive: true,
        },
        { isActive: false },
        { new: true }
      );

      if (!device) {
        throw new AppError(404, "Device not found");
      }

      // Remove device from location if assigned
      if (device.locationId) {
        await Location.findByIdAndUpdate(device.locationId, {
          $unset: { deviceId: 1 },
        });
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Error deleting device");
    }
  }

  async updateDeviceReading(
    deviceId: string,
    reading: {
      moisture10cm: number;
      moisture20cm: number;
      moisture30cm: number;
    }
  ): Promise<IDevice> {
    try {
      const device = await Device.findOneAndUpdate(
        { deviceId, isActive: true },
        {
          lastReading: {
            ...reading,
            timestamp: new Date(),
          },
        },
        { new: true }
      );

      if (!device) {
        throw new AppError(404, "Device not found");
      }

      return device;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(400, "Error updating device reading");
    }
  }
}
