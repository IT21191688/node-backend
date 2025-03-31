// src/services/notificationService.ts
import { admin } from "../config/firebase";
import { User, IUser } from "../models/user";
import { Device } from "../models/device";
import { WateringSchedule } from "../models/wateringSchedule";
import { messaging } from "firebase-admin";

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class NotificationService {
  /**
   * Send notification to a specific user
   */
  async sendToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Get user's FCM tokens
      const user = await User.findById(userId);

      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        console.log(`No FCM tokens found for user ${userId}`);
        return false;
      }

      // Send to all user devices
      const results = await Promise.all(
        user.fcmTokens.map((token: string) => this.sendToDevice(token, payload))
      );

      return results.some((result) => result);
    } catch (error) {
      console.error("Error sending notification to user:", error);
      return false;
    }
  }

  /**
   * Send notification to a specific device token
   */
  async sendToDevice(
    token: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const message: messaging.Message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        token: token,
        android: {
          priority: "high" as const,
          notification: {
            sound: "default",
            channelId: "default-channel",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent notification:", response);
      return true;
    } catch (error) {
      console.error("Error sending notification to device:", error);

      // If token is invalid, we should remove it
      const typedError = error as { code?: string };
      if (
        typedError.code === "messaging/invalid-registration-token" ||
        typedError.code === "messaging/registration-token-not-registered"
      ) {
        await this.removeInvalidToken(token);
      }

      return false;
    }
  }

  /**
   * Remove invalid token from all users
   */
  private async removeInvalidToken(token: string): Promise<void> {
    try {
      await User.updateMany(
        { fcmTokens: token },
        { $pull: { fcmTokens: token } }
      );
      console.log(`Removed invalid token: ${token}`);
    } catch (error) {
      console.error("Error removing invalid token:", error);
    }
  }

  /**
   * Send low battery notification
   */
  async sendLowBatteryAlert(
    deviceId: string,
    batteryLevel: number
  ): Promise<boolean> {
    try {
      const device = await Device.findOne({ deviceId });

      if (!device) {
        console.log(`Device not found: ${deviceId}`);
        return false;
      }

      return await this.sendToUser(device.userId.toString(), {
        title: "Low Battery Alert",
        body: `Your device ${deviceId} has a low battery level (${batteryLevel}%)`,
        data: {
          type: "battery_alert",
          deviceId,
          batteryLevel: batteryLevel.toString(),
        },
      });
    } catch (error) {
      console.error("Error sending low battery alert:", error);
      return false;
    }
  }

  /**
   * Send moisture level alert
   */
  async sendMoistureAlert(
    deviceId: string,
    moisture: number
  ): Promise<boolean> {
    try {
      const device = await Device.findOne({ deviceId });

      if (!device) {
        console.log(`Device not found: ${deviceId}`);
        return false;
      }

      const threshold = device.settings?.thresholds?.moisture || 20;

      if (moisture < threshold) {
        return await this.sendToUser(device.userId.toString(), {
          title: "Low Moisture Alert",
          body: `Soil moisture level is low (${moisture}%) for device ${deviceId}`,
          data: {
            type: "moisture_alert",
            deviceId,
            moisture: moisture.toString(),
          },
        });
      }

      return false;
    } catch (error) {
      console.error("Error sending moisture alert:", error);
      return false;
    }
  }

  /**
   * Send watering schedule reminder
   */
  async sendWateringReminder(scheduleId: string): Promise<boolean> {
    try {
      const schedule =
        await WateringSchedule.findById(scheduleId).populate("locationId");

      if (!schedule) {
        console.log(`Schedule not found: ${scheduleId}`);
        return false;
      }

      const location = schedule.locationId as any;

      return await this.sendToUser(schedule.userId.toString(), {
        title: "Watering Reminder",
        body: `It's time to water your ${location.name} location with ${schedule.recommendedAmount}L of water`,
        data: {
          type: "watering_reminder",
          scheduleId: scheduleId,
          locationId: location._id.toString(),
          locationName: location.name,
        },
      });
    } catch (error) {
      console.error("Error sending watering reminder:", error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
