// import cron from "node-cron";
// import { WateringService } from "../services/wateringService";
// import { DeviceService } from "../services/deviceService";
// import { notificationService } from "../services/notificationService";
// import { Location } from "../models/location";

// export class ScheduleCron {
//   private wateringService: WateringService;
//   private DeviceService: DeviceService;

//   constructor() {
//     this.wateringService = new WateringService();
//     this.DeviceService = new DeviceService();
//     this.initCronJobs();
//   }

//   // Examples:
//   // '0 6 * * *'  // 6:00 AM every day
//   // '0 7 * * *'  // 7:00 AM every day
//   // '0 */6 * * *' // Every 6 hours
//   // '0 6,18 * * *' // Twice a day at 6 AM and 6 PM

//   private initCronJobs() {
//     // Run every day at 6:00 AM
//     cron.schedule("0 6 * * *", async () => {
//       // console.log('Starting daily schedule creation...');
//       try {
//         await this.wateringService.createDailySchedules();
//         // console.log('Daily schedule creation completed successfully');
//       } catch (error) {
//         console.error("Error in cron job:", error);
//       }
//     });

//     cron.schedule("* * * * *", async () => {
//       // console.log('Starting battery level updates...');
//       try {
//         const result = await this.DeviceService.updateDeviceBatteryLevels();
//       } catch (error) {
//         console.error("Error in battery update cron job:", error);
//       }
//     });
//   }
// }
// src/cron/sheduleCron.ts
import cron from "node-cron";
import { WateringService } from "../services/wateringService";
import { DeviceService } from "../services/deviceService";
import { firebaseService } from "../config/firebase";
import { notificationService } from "../services/notificationService";
import { Location } from "../models/location";
import { Device } from "../models/device";

export class ScheduleCron {
  private wateringService: WateringService;
  private deviceService: DeviceService;

  constructor() {
    this.wateringService = new WateringService();
    this.deviceService = new DeviceService();
    this.initCronJobs();
  }

  private initCronJobs() {
    // Run every day at 6:00 AM
    cron.schedule("0 6 * * *", async () => {
      // console.log('Starting daily schedule creation...');
      try {
        await this.wateringService.createDailySchedules();
        // console.log('Daily schedule creation completed successfully');
      } catch (error) {
        console.error("Error in cron job:", error);
      }
    });

    // Run every minute to update battery levels
    cron.schedule("* * * * *", async () => {
      // console.log('Starting battery level updates...');
      try {
        const result = await this.deviceService.updateDeviceBatteryLevels();
      } catch (error) {
        console.error("Error in battery update cron job:", error);
      }
    });

    // New job: Check moisture levels every 2 minutes
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

  // New method to check moisture levels and send notifications
  private async checkMoistureLevels() {
    try {
      // Get all active devices
      const devices = await Device.find({
        isActive: true,
        status: "active",
      });

      console.log(`Checking moisture levels for ${devices.length} devices...`);

      for (const device of devices) {
        try {
          // Only process soil sensors
          if (device.type !== "soil_sensor") continue;

          // Get the latest moisture readings
          const readings = await firebaseService.getSoilMoistureReadings(
            device.deviceId
          );
          if (!readings) {
            console.log(`No readings available for device ${device.deviceId}`);
            continue;
          }

          // Calculate average moisture level
          const avgMoisture =
            (readings.moisture10cm +
              readings.moisture20cm +
              readings.moisture30cm) /
            3;

          // Check if moisture level is below threshold (30%)
          if (avgMoisture < 30) {
            console.log(
              `Low moisture detected for device ${device.deviceId}: ${avgMoisture.toFixed(1)}%`
            );

            // Get location name for better notification context
            const location = await Location.findOne({
              deviceId: device.deviceId,
            });
            const locationName = location ? location.name : "Unknown location";

            // Send notification
            await notificationService.sendLowMoistureLevelNotifications(
              device.deviceId,
              locationName,
              Math.round(avgMoisture)
            );

            console.log(
              `Notification sent for device ${device.deviceId} at ${locationName}`
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
