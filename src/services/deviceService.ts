import { Types } from "mongoose";
import { Device, IDevice } from "../models/device";
import { Location } from "../models/location";
import { AppError } from "../middleware/errorHandler";
import { firebaseService } from "../config/firebase";
import { notificationService } from "./notificationService";

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
        throw new AppError(405, "Device ID already exists");
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

  // async updateDeviceReading(
  //   deviceId: string,
  //   reading: {
  //     moisture10cm: number;
  //     moisture20cm: number;
  //     moisture30cm: number;
  //   }
  // ): Promise<IDevice> {
  //   try {
  //     const device = await Device.findOneAndUpdate(
  //       { deviceId, isActive: true },
  //       {
  //         lastReading: {
  //           ...reading,
  //           timestamp: new Date(),
  //         },
  //       },
  //       { new: true }
  //     );

  //     if (!device) {
  //       throw new AppError(404, "Device not found");
  //     }

  //     return device;
  //   } catch (error) {
  //     if (error instanceof AppError) throw error;
  //     throw new AppError(400, "Error updating device reading");
  //   }
  // }

  async updateDevice(
    deviceId: string,
    userId: string,
    data: Partial<IDevice>
  ): Promise<IDevice> {
    try {
      // First find the device
      const device = await Device.findOne({
        deviceId: deviceId,
        userId: new Types.ObjectId(userId),
        isActive: true,
      });

      if (!device) {
        throw new AppError(404, "Device not found");
      }

      // Check if status change is requested and if device is assigned to a location
      if (
        (data.status === "inactive" || data.status === "maintenance") &&
        device.locationId
      ) {
        throw new AppError(
          400,
          "Cannot change device status to inactive or maintenance while assigned to a location"
        );
      }

      // If validation passes, proceed with update
      const updatedDevice = await Device.findOneAndUpdate(
        {
          deviceId: deviceId,
          userId: new Types.ObjectId(userId),
          isActive: true,
        },
        data,
        { new: true, runValidators: true }
      );

      return updatedDevice as IDevice;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(400, "Error updating device");
    }
  }

  // async updateDeviceBatteryLevels(): Promise<{
  //   updated: number;
  //   message: string;
  // }> {
  //   try {
  //     // Get all active devices
  //     const devices = await Device.find({
  //       isActive: true,
  //       status: { $ne: "inactive" }, // Skip inactive devices
  //     });

  //     let updatedCount = 0;

  //     // Process each device
  //     for (const device of devices) {
  //       try {
  //         // Get latest battery reading from Firebase
  //         const readings = await firebaseService.getSoilMoistureReadings(
  //           device.deviceId
  //         );

  //         if (readings && readings.batteryLevel !== undefined) {
  //           // Update the device's battery level in the database
  //           await Device.findOneAndUpdate(
  //             { deviceId: device.deviceId },
  //             {
  //               batteryLevel: readings.batteryLevel,
  //               lastBatteryUpdate: new Date(),
  //             }
  //           );

  //           updatedCount++;
  //         }
  //       } catch (deviceError) {
  //         console.error(
  //           `Error updating battery for device ${device.deviceId}:`,
  //           deviceError
  //         );
  //         // Continue with next device
  //       }
  //     }

  //     return {
  //       updated: updatedCount,
  //       message: `Updated battery levels for ${updatedCount} devices`,
  //     };
  //   } catch (error) {
  //     console.error("Error in updateDeviceBatteryLevels:", error);
  //     throw error;
  //   }
  // }

  async updateDeviceBatteryLevels(): Promise<{
    updated: number;
    message: string;
    notificationsSent: number;
  }> {
    try {
      // Get all active devices
      const devices: any = await Device.find({
        isActive: true,
        status: { $ne: "inactive" }, // Skip inactive devices
      }).populate("userId", "notificationPreferences"); // Get notification preferences

      let updatedCount = 0;
      let notificationsSent = 0;

      // Process each device
      for (const device of devices) {
        try {
          // Get latest battery reading from Firebase
          const readings = await firebaseService.getSoilMoistureReadings(
            device.deviceId
          );

          if (readings && readings.batteryLevel !== undefined) {
            const previousBatteryLevel = device.batteryLevel || 100;
            const newBatteryLevel = readings.batteryLevel;

            // Update the device's battery level in the database
            await Device.findOneAndUpdate(
              { deviceId: device.deviceId },
              {
                batteryLevel: newBatteryLevel,
                lastBatteryUpdate: new Date(),
              }
            );

            updatedCount++;

            // Check if battery alert should be sent
            const user = device.userId as any;
            const shouldNotify =
              user.notificationPreferences?.batteryAlerts !== false;

            // Send notification if battery level is low (less than 20%)
            // and we haven't sent a notification in the last 24 hours
            if (
              shouldNotify &&
              newBatteryLevel < 20 &&
              (!device.lastNotificationSent ||
                Date.now() - device.lastNotificationSent.getTime() >
                  24 * 60 * 60 * 1000)
            ) {
              const notificationSent =
                await notificationService.sendLowBatteryAlert(
                  device.deviceId,
                  newBatteryLevel
                );

              if (notificationSent) {
                notificationsSent++;
                // Update the last notification sent timestamp
                await Device.findOneAndUpdate(
                  { deviceId: device.deviceId },
                  { lastNotificationSent: new Date() }
                );
              }
            }
          }
        } catch (deviceError) {
          console.error(
            `Error updating battery for device ${device.deviceId}:`,
            deviceError
          );
          // Continue with next device
        }
      }

      return {
        updated: updatedCount,
        message: `Updated battery levels for ${updatedCount} devices`,
        notificationsSent,
      };
    } catch (error) {
      console.error("Error in updateDeviceBatteryLevels:", error);
      throw error;
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
      const device = await Device.findOne({
        deviceId,
        isActive: true,
      }).populate("userId", "notificationPreferences");

      if (!device) {
        throw new AppError(404, "Device not found");
      }

      // Update the device reading
      const updatedDevice = await Device.findOneAndUpdate(
        { deviceId, isActive: true },
        {
          lastReading: {
            ...reading,
            timestamp: new Date(),
          },
        },
        { new: true }
      );

      // Check if moisture alert should be sent
      const user = device.userId as any;
      const shouldNotify =
        user.notificationPreferences?.moistureAlerts !== false;
      const moistureThreshold = device.settings?.thresholds?.moisture || 20;

      // Calculate average moisture level
      const avgMoisture =
        (reading.moisture10cm + reading.moisture20cm + reading.moisture30cm) /
        3;

      // Send notification if average moisture is below threshold
      // and we haven't sent a notification in the last 24 hours
      if (
        shouldNotify &&
        avgMoisture < moistureThreshold &&
        (!device.lastNotificationSent ||
          Date.now() - device.lastNotificationSent.getTime() >
            24 * 60 * 60 * 1000)
      ) {
        const notificationSent = await notificationService.sendMoistureAlert(
          deviceId,
          avgMoisture
        );

        if (notificationSent) {
          // Update the last notification sent timestamp
          await Device.findOneAndUpdate(
            { deviceId },
            { lastNotificationSent: new Date() }
          );
        }
      }

      return updatedDevice as IDevice;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(400, "Error updating device reading");
    }
  }
}
