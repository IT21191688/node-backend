// // import cron from "node-cron";
// // import { WateringService } from "../services/wateringService";
// // import { DeviceService } from "../services/deviceService";

// // export class ScheduleCron {
// //   private wateringService: WateringService;
// //   private DeviceService: DeviceService;

// //   constructor() {
// //     this.wateringService = new WateringService();
// //     this.DeviceService = new DeviceService();
// //     this.initCronJobs();
// //   }

// //   // Examples:
// //   // '0 6 * * *'  // 6:00 AM every day
// //   // '0 7 * * *'  // 7:00 AM every day
// //   // '0 */6 * * *' // Every 6 hours
// //   // '0 6,18 * * *' // Twice a day at 6 AM and 6 PM

// //   private initCronJobs() {
// //     // Run every day at 6:00 AM
// //     cron.schedule("0 6 * * *", async () => {
// //       // console.log('Starting daily schedule creation...');
// //       try {
// //         await this.wateringService.createDailySchedules();
// //         // console.log('Daily schedule creation completed successfully');
// //       } catch (error) {
// //         console.error("Error in cron job:", error);
// //       }
// //     });

// //     cron.schedule("* * * * *", async () => {
// //       // console.log('Starting battery level updates...');
// //       try {
// //         const result = await this.DeviceService.updateDeviceBatteryLevels();
// //       } catch (error) {
// //         console.error("Error in battery update cron job:", error);
// //       }
// //     });
// //   }
// // }
// // src/services/scheduleCron.ts
// import cron from "node-cron";
// import { WateringService } from "../services/wateringService";
// import { DeviceService } from "../services/deviceService";
// import { WateringSchedule } from "../models/wateringSchedule";
// import { User } from "../models/user";
// import { Device } from "../models/device";
// import { notificationService } from "../services/notificationService";

// export class ScheduleCron {
//   private wateringService: WateringService;
//   private deviceService: DeviceService;

//   constructor() {
//     this.wateringService = new WateringService();
//     this.deviceService = new DeviceService();
//     this.initCronJobs();
//   }

//   private initCronJobs() {
//     // Run every day at 6:00 AM - Create daily schedules
//     cron.schedule("0 6 * * *", async () => {
//       console.log("Starting daily schedule creation...");
//       try {
//         await this.wateringService.createDailySchedules();
//         console.log("Daily schedule creation completed successfully");
//       } catch (error) {
//         console.error("Error in daily schedule creation cron job:", error);
//       }
//     });

//     // Run every minute - Update battery levels and check for low battery
//     cron.schedule("* * * * *", async () => {
//       try {
//         const result = await this.deviceService.updateDeviceBatteryLevels();
//         if (result.notificationsSent > 0) {
//           console.log(
//             `Sent ${result.notificationsSent} low battery notifications`
//           );
//         }
//       } catch (error) {
//         console.error("Error in battery update cron job:", error);
//       }
//     });

//     // Run every hour - Send watering reminders for today's schedules
//     cron.schedule("0 * * * *", async () => {
//       console.log("Checking for watering reminders...");
//       try {
//         await this.sendWateringReminders();
//       } catch (error) {
//         console.error("Error in watering reminder cron job:", error);
//       }
//     });

//     // Run every 4 hours - Check for low moisture and send alerts
//     cron.schedule("* * * * *", async () => {
//       console.log("Checking for low moisture levels...");

//       try {
//         await this.checkMoistureLevels();
//       } catch (error) {
//         console.error("Error in moisture check cron job:", error);
//       }
//     });
//   }

//   // You can add this method to ScheduleCron
//   async sendTestNotification(userId: string): Promise<boolean> {
//     return await notificationService.sendToUser(userId, {
//       title: "Test Notification",
//       body: "This is a test notification from your system",
//       data: {
//         type: "test",
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }

//   /**
//    * Send reminders for today's watering schedules
//    */
//   private async sendWateringReminders(): Promise<void> {
//     try {
//       // Get today's date range
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const tomorrow = new Date(today);
//       tomorrow.setDate(tomorrow.getDate() + 1);

//       // Find pending schedules for today
//       const schedules: any = await WateringSchedule.find({
//         status: "pending",
//         date: { $gte: today, $lt: tomorrow },
//         deletedAt: null,
//       })
//         .populate({
//           path: "userId",
//           select: "notificationPreferences fcmTokens",
//         })
//         .populate("locationId");

//       console.log(
//         `Found ${schedules.length} pending watering schedules for today`
//       );

//       let remindersSent = 0;

//       // Process each schedule
//       for (const schedule of schedules) {
//         try {
//           const user = schedule.userId as any;

//           // Check if user wants watering reminders and has FCM tokens
//           if (
//             user.notificationPreferences?.wateringReminders !== false &&
//             user.fcmTokens &&
//             user.fcmTokens.length > 0
//           ) {
//             // Send the watering reminder
//             const notificationSent =
//               await notificationService.sendWateringReminder(
//                 schedule._id.toString()
//               );

//             if (notificationSent) {
//               remindersSent++;
//               console.log(
//                 `Sent watering reminder for schedule ${schedule._id}`
//               );
//             }
//           }
//         } catch (error) {
//           console.error(
//             `Error sending reminder for schedule ${schedule._id}:`,
//             error
//           );
//           // Continue with next schedule
//         }
//       }

//       console.log(
//         `Sent ${remindersSent} watering reminders out of ${schedules.length} schedules`
//       );
//     } catch (error) {
//       console.error("Error in sendWateringReminders:", error);
//       throw error;
//     }
//   }

//   /**
//    * Check for low moisture levels and send alerts if needed
//    */
//   private async checkMoistureLevels(): Promise<void> {
//     try {
//       // Get all active devices
//       const devices = await Device.find({
//         isActive: true,
//         status: { $ne: "inactive" }, // Skip inactive devices
//       }).populate({
//         path: "userId",
//         select: "notificationPreferences fcmTokens",
//       });

//       console.log(`Checking moisture levels for ${devices.length} devices`);

//       let alertsSent = 0;

//       // Process each device
//       for (const device of devices) {
//         try {
//           // Skip devices without lastReading
//           if (!device.lastReading) continue;

//           const user = device.userId as any;

//           // Skip if user doesn't want notifications or has no tokens
//           if (
//             user.notificationPreferences?.moistureAlerts === false ||
//             !user.fcmTokens ||
//             user.fcmTokens.length === 0
//           ) {
//             continue;
//           }

//           // Calculate average moisture
//           const avgMoisture =
//             (device.lastReading.moisture10cm +
//               device.lastReading.moisture20cm +
//               device.lastReading.moisture30cm) /
//             3;

//           // Get threshold from device settings or use default
//           const threshold = device.settings?.thresholds?.moisture || 20;

//           // Check if moisture is below threshold and we haven't notified recently
//           if (
//             avgMoisture < threshold &&
//             (!device.lastNotificationSent ||
//               Date.now() - new Date(device.lastNotificationSent).getTime() >
//                 24 * 60 * 60 * 1000)
//           ) {
//             // Send notification
//             const notificationSent =
//               await notificationService.sendMoistureAlert(
//                 device.deviceId,
//                 avgMoisture
//               );

//             if (notificationSent) {
//               alertsSent++;
//               console.log(`Sent moisture alert for device ${device.deviceId}`);

//               // Update last notification time
//               await Device.findByIdAndUpdate(device._id, {
//                 lastNotificationSent: new Date(),
//               });
//             }
//           }
//         } catch (deviceError) {
//           console.error(
//             `Error checking moisture for device ${device.deviceId}:`,
//             deviceError
//           );
//           // Continue with next device
//         }
//       }

//       console.log(`Sent ${alertsSent} moisture alerts`);
//     } catch (error) {
//       console.error("Error in checkMoistureLevels:", error);
//       throw error;
//     }
//   }
// }

// // Export an instance to be used in the application
// export const scheduleCron = new ScheduleCron();
// src/services/scheduleCron.ts
import cron from "node-cron";
import { WateringService } from "../services/wateringService";
import { DeviceService } from "../services/deviceService";
import { WateringSchedule } from "../models/wateringSchedule";
import { User } from "../models/user";
import { Device } from "../models/device";
import { notificationService } from "../services/notificationService";

export class ScheduleCron {
  private wateringService: WateringService;
  private deviceService: DeviceService;

  constructor() {
    this.wateringService = new WateringService();
    this.deviceService = new DeviceService();
    this.initCronJobs();
  }

  private initCronJobs() {
    // Run every day at 6:00 AM - Create daily schedules
    cron.schedule("0 6 * * *", async () => {
      console.log("Starting daily schedule creation...");
      try {
        await this.wateringService.createDailySchedules();
        console.log("Daily schedule creation completed successfully");
      } catch (error) {
        console.error("Error in daily schedule creation cron job:", error);
      }
    });

    // Run every minute - Update battery levels and check for low battery
    cron.schedule("* * * * *", async () => {
      try {
        const result = await this.deviceService.updateDeviceBatteryLevels();
        if (result.notificationsSent > 0) {
          console.log(
            `Sent ${result.notificationsSent} low battery notifications`
          );
        }
      } catch (error) {
        console.error("Error in battery update cron job:", error);
      }
    });

    // Run every hour - Send watering reminders for today's schedules
    cron.schedule("0 * * * *", async () => {
      console.log("Checking for watering reminders...");
      try {
        await this.sendWateringReminders();
      } catch (error) {
        console.error("Error in watering reminder cron job:", error);
      }
    });

    // Run every 4 hours - Check for low moisture and send alerts
    cron.schedule("0 */4 * * *", async () => {
      console.log("Checking for low moisture levels...");
      try {
        await this.checkMoistureLevels();
      } catch (error) {
        console.error("Error in moisture check cron job:", error);
      }
    });

    // TEST NOTIFICATION - Run every 2 minutes
    // Comment this out or remove after testing
    cron.schedule("* * * * *", async () => {
      console.log("Sending test notifications...");
      try {
        await this.sendTestNotifications();
      } catch (error) {
        console.error("Error sending test notifications:", error);
      }
    });
  }

  /**
   * Send test notifications to all active users
   * FOR TESTING PURPOSES ONLY
   */
  private async sendTestNotifications(): Promise<void> {
    try {
      // Get a few active users with FCM tokens
      const users: any = await User.find({
        isActive: true,
        fcmTokens: { $exists: true, $not: { $size: 0 } },
      }).limit(3);

      console.log(`Found ${users.length} users for test notifications`);

      if (users.length === 0) {
        console.log("No active users with FCM tokens found for testing");
        return;
      }

      let successCount = 0;

      // Send a test notification to each user
      for (const user of users) {
        const success = await this.sendTestNotification(user._id.toString());
        if (success) {
          successCount++;
          console.log(
            `Successfully sent test notification to user ${user._id}`
          );
        } else {
          console.log(`Failed to send test notification to user ${user._id}`);
        }
      }

      console.log(
        `Test notifications summary: ${successCount}/${users.length} successful`
      );
    } catch (error) {
      console.error("Error in sendTestNotifications:", error);
      throw error;
    }
  }

  /**
   * Send a test notification to a specific user
   */
  async sendTestNotification(userId: string): Promise<boolean> {
    console.log(`Attempting to send test notification to user ${userId}`);
    return await notificationService.sendToUser(userId, {
      title: "Test Notification",
      body: "This is a test notification from your system",
      data: {
        type: "test",
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send reminders for today's watering schedules
   */
  private async sendWateringReminders(): Promise<void> {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find pending schedules for today
      const schedules: any = await WateringSchedule.find({
        status: "pending",
        date: { $gte: today, $lt: tomorrow },
        deletedAt: null,
      })
        .populate({
          path: "userId",
          select: "notificationPreferences fcmTokens",
        })
        .populate("locationId");

      console.log(
        `Found ${schedules.length} pending watering schedules for today`
      );

      let remindersSent = 0;

      // Process each schedule
      for (const schedule of schedules) {
        try {
          const user = schedule.userId as any;

          // More detailed logging
          console.log(
            `Schedule ${schedule._id}: User has wateringReminders=${user.notificationPreferences?.wateringReminders}`
          );
          console.log(
            `Schedule ${schedule._id}: User has ${user.fcmTokens?.length || 0} FCM tokens`
          );

          // Check if user wants watering reminders and has FCM tokens
          if (
            user.notificationPreferences?.wateringReminders !== false &&
            user.fcmTokens &&
            user.fcmTokens.length > 0
          ) {
            // Send the watering reminder
            const notificationSent =
              await notificationService.sendWateringReminder(
                schedule._id.toString()
              );

            if (notificationSent) {
              remindersSent++;
              console.log(
                `Sent watering reminder for schedule ${schedule._id}`
              );
            } else {
              console.log(
                `Failed to send watering reminder for schedule ${schedule._id}`
              );
            }
          } else {
            console.log(
              `Skipping notification for schedule ${schedule._id}: user preferences or tokens not set`
            );
          }
        } catch (error) {
          console.error(
            `Error sending reminder for schedule ${schedule._id}:`,
            error
          );
          // Continue with next schedule
        }
      }

      console.log(
        `Sent ${remindersSent} watering reminders out of ${schedules.length} schedules`
      );
    } catch (error) {
      console.error("Error in sendWateringReminders:", error);
      throw error;
    }
  }

  /**
   * Check for low moisture levels and send alerts if needed
   */
  private async checkMoistureLevels(): Promise<void> {
    try {
      // Get all active devices
      const devices = await Device.find({
        isActive: true,
        status: { $ne: "inactive" }, // Skip inactive devices
      }).populate({
        path: "userId",
        select: "notificationPreferences fcmTokens",
      });

      console.log(`Checking moisture levels for ${devices.length} devices`);

      let alertsSent = 0;

      // Process each device
      for (const device of devices) {
        try {
          // Skip devices without lastReading
          if (!device.lastReading) {
            console.log(`Device ${device.deviceId}: No last reading available`);
            continue;
          }

          const user = device.userId as any;

          // More detailed logging
          console.log(
            `Device ${device.deviceId}: User has moistureAlerts=${user.notificationPreferences?.moistureAlerts}`
          );
          console.log(
            `Device ${device.deviceId}: User has ${user.fcmTokens?.length || 0} FCM tokens`
          );

          // Skip if user doesn't want notifications or has no tokens
          if (
            user.notificationPreferences?.moistureAlerts === false ||
            !user.fcmTokens ||
            user.fcmTokens.length === 0
          ) {
            console.log(
              `Skipping device ${device.deviceId}: user preferences or tokens not set`
            );
            continue;
          }

          // Calculate average moisture
          const avgMoisture =
            (device.lastReading.moisture10cm +
              device.lastReading.moisture20cm +
              device.lastReading.moisture30cm) /
            3;

          // Get threshold from device settings or use default
          const threshold = device.settings?.thresholds?.moisture || 20;

          console.log(
            `Device ${device.deviceId}: Avg moisture=${avgMoisture.toFixed(1)}%, Threshold=${threshold}%`
          );
          console.log(
            `Device ${device.deviceId}: Last notification sent: ${device.lastNotificationSent || "never"}`
          );

          // Check if moisture is below threshold and we haven't notified recently
          const shouldNotify =
            avgMoisture < threshold &&
            (!device.lastNotificationSent ||
              Date.now() - new Date(device.lastNotificationSent).getTime() >
                24 * 60 * 60 * 1000);

          if (shouldNotify) {
            console.log(
              `Device ${device.deviceId}: Sending moisture alert (${avgMoisture.toFixed(1)}% < ${threshold}%)`
            );

            // Send notification
            const notificationSent =
              await notificationService.sendMoistureAlert(
                device.deviceId,
                avgMoisture
              );

            if (notificationSent) {
              alertsSent++;
              console.log(`Sent moisture alert for device ${device.deviceId}`);

              // Update last notification time
              await Device.findByIdAndUpdate(device._id, {
                lastNotificationSent: new Date(),
              });
            } else {
              console.log(
                `Failed to send moisture alert for device ${device.deviceId}`
              );
            }
          } else {
            console.log(
              `Device ${device.deviceId}: No notification needed (${avgMoisture.toFixed(1)}% >= ${threshold}% or notified recently)`
            );
          }
        } catch (deviceError) {
          console.error(
            `Error checking moisture for device ${device.deviceId}:`,
            deviceError
          );
          // Continue with next device
        }
      }

      console.log(`Sent ${alertsSent} moisture alerts`);
    } catch (error) {
      console.error("Error in checkMoistureLevels:", error);
      throw error;
    }
  }
}

// Export an instance to be used in the application
export const scheduleCron = new ScheduleCron();
