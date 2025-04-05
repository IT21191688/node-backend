import cron from "node-cron";
import { WateringService } from "../services/wateringService";
import { DeviceService } from "../services/deviceService";
import { firebaseService } from "../config/firebase";
import { notificationService } from "../services/notificationService";
import { Device } from "../models/device";
import { Location } from "../models/location";

export class ScheduleCron {
  private wateringService: WateringService;
  private deviceService: DeviceService;
  // Threshold for low moisture alert (in percent)
  private readonly MOISTURE_THRESHOLD = 30;

  constructor() {
    this.wateringService = new WateringService();
    this.deviceService = new DeviceService();
    this.initCronJobs();
  }

  private initCronJobs() {
    cron.schedule("0 6 * * *", async () => {
      console.log("Starting daily schedule creation...");
      try {
        await this.wateringService.createDailySchedules();
        console.log("Daily schedule creation completed successfully");
      } catch (error) {
        console.error("Error in cron job:", error);
      }
    });

    // Run every minute to update battery levels
    cron.schedule("* * * * *", async () => {
      try {
        await this.deviceService.updateDeviceBatteryLevels();
      } catch (error) {
        console.error("Error in battery update cron job:", error);
      }
    });

    cron.schedule("*/2 * * * *", async () => {
      console.log("Starting moisture level check...");
      try {
        await this.checkMoistureLevels();
        console.log("Moisture level check completed");
      } catch (error) {
        console.error("Error in moisture check cron job:", error);
      }
    });
  }

  // Method to check moisture levels and send notifications
  private async checkMoistureLevels() {
    try {
      // Get all active soil sensor devices
      const devices = await Device.find({
        isActive: true,
        status: "active",
        type: "soil_sensor",
      });

      console.log(`Checking moisture levels for ${devices.length} devices...`);

      for (const device of devices) {
        try {
          // Get the latest moisture readings from Firebase
          const readings = await firebaseService.getSoilMoistureReadings(
            device.deviceId
          );

          if (!readings) {
            console.log(`No readings available for device ${device.deviceId}`);
            continue;
          }

          // Save the latest reading to the device record
          device.lastReading = {
            moisture10cm: readings.moisture10cm,
            moisture20cm: readings.moisture20cm,
            moisture30cm: readings.moisture30cm,
            timestamp: readings.timestamp,
          };

          // Also update battery level if available
          if (readings.batteryLevel !== undefined) {
            device.batteryLevel = readings.batteryLevel;
          }

          // Save the updated device record
          await device.save();

          // Calculate average moisture level from all depths
          const avgMoisture =
            (readings.moisture10cm +
              readings.moisture20cm +
              readings.moisture30cm) /
            3;

          // Check if moisture level is below threshold
          if (avgMoisture < this.MOISTURE_THRESHOLD) {
            console.log(
              `Low moisture detected for device ${device.deviceId}: ${avgMoisture.toFixed(1)}%`
            );

            // Get location name for better notification context
            const location = await Location.findOne({
              deviceId: device.deviceId,
            });
            const locationName: any = location ? location.name : undefined;

            // Send notification
            await notificationService.sendLowMoistureLevelNotifications(
              device.deviceId,
              locationName,
              Math.round(avgMoisture)
            );
          }
        } catch (deviceError) {
          console.error(
            `Error processing device ${device.deviceId}:`,
            deviceError
          );
          // Continue with next device
        }
      }
    } catch (error) {
      console.error("Error in checkMoistureLevels:", error);
      throw error;
    }
  }
}
