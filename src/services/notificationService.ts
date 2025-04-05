import { firebaseService } from "../config/firebase";
import { User } from "../models/user";
import { Device } from "../models/device";
import { Location } from "../models/location";

export class NotificationService {
  /**
   * Send notification to a specific user
   */
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      // Find user by ID to get FCM token
      const user = await User.findById(userId);

      if (!user) {
        console.log(`User not found: ${userId}`);
        return;
      }

      if (!user.fcmToken) {
        console.log(`No FCM token found for user ${userId}`);
        return;
      }

      // Send notification using Firebase service
      await firebaseService.sendNotification(user.fcmToken, title, body, data);

      console.log(`Notification sent to user ${userId}`);
    } catch (error) {
      console.error("Error sending notification to user:", error);
      throw error;
    }
  }

  /**
   * Send notification to users with low water/moisture level
   */
  async sendLowMoistureLevelNotifications(
    deviceId: string,
    locationName: string,
    moistureLevel: number
  ): Promise<void> {
    try {
      // Find the device to get the associated user
      const device = await Device.findOne({ deviceId });

      if (!device) {
        console.log(`Device not found: ${deviceId}`);
        return;
      }

      // Find location if not provided
      let locationDisplayName = locationName;
      if (!locationDisplayName) {
        const location = await Location.findOne({ deviceId });
        locationDisplayName = location ? location.name : "your farm";
      }

      // Prepare notification content
      const title = "Low Soil Moisture Alert";
      const body = `Soil moisture level at ${locationDisplayName} is ${moistureLevel}%. Consider watering soon.`;

      // Prepare data payload for potential deep linking
      const data = {
        type: "low_moisture",
        deviceId,
        moistureLevel: String(moistureLevel),
        locationName: locationDisplayName,
      };

      // Send notification to the device owner
      await this.sendNotificationToUser(
        device.userId.toString(),
        title,
        body,
        data
      );

      console.log(
        `Low moisture notification sent for device ${deviceId} at ${locationDisplayName}`
      );
    } catch (error) {
      console.error("Error sending low moisture notifications:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
