// src/services/notificationService.ts
import { Types } from "mongoose";
import { DeviceToken } from "../models/deviceToken";
import { firebaseService } from "../config/firebase";
import { User } from "../models/user";

export class NotificationService {
  /**
   * Register a device token for a user
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    device?: string
  ): Promise<void> {
    try {
      // Check if token already exists
      const existingToken = await DeviceToken.findOne({ token });

      if (existingToken) {
        // Update the token with the new userId if it's different
        if (existingToken.userId.toString() !== userId) {
          existingToken.userId = new Types.ObjectId(userId);
          if (device) existingToken.device = device;
          await existingToken.save();
        }
        return;
      }

      // Create new token
      await DeviceToken.create({
        userId: new Types.ObjectId(userId),
        token,
        device,
      });
    } catch (error) {
      console.error("Error registering device token:", error);
      throw error;
    }
  }

  /**
   * Remove a device token
   */
  async removeDeviceToken(token: string): Promise<void> {
    try {
      await DeviceToken.findOneAndDelete({ token });
    } catch (error) {
      console.error("Error removing device token:", error);
      throw error;
    }
  }

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
      const tokens = await this.getUserTokens(userId);

      if (tokens.length === 0) {
        console.log(`No device tokens found for user ${userId}`);
        return;
      }

      await firebaseService.sendMulticastNotification(
        tokens,
        title,
        body,
        data
      );
    } catch (error) {
      console.error("Error sending notification to user:", error);
      throw error;
    }
  }

  /**
   * Get all device tokens for a user
   */
  async getUserTokens(userId: string): Promise<string[]> {
    try {
      const deviceTokens = await DeviceToken.find({
        userId: new Types.ObjectId(userId),
      });
      return deviceTokens.map((dt) => dt.token);
    } catch (error) {
      console.error("Error getting user tokens:", error);
      throw error;
    }
  }

  /**
   * Send notification to users with low water level
   */
  async sendLowMoistureLevelNotifications(
    deviceId: string,
    locationName: string,
    moistureLevel: number
  ): Promise<void> {
    try {
      // Find the device to get the location and user
      const device = await this.getDeviceWithUser(deviceId);

      if (!device || !device.userId) {
        console.log(`No device or user found for device ${deviceId}`);
        return;
      }

      const locationDisplayName = locationName || "your location";
      const title = "Low Soil Moisture Alert";
      const body = `Soil moisture level at ${locationDisplayName} is ${moistureLevel}%. Consider watering soon.`;

      await this.sendNotificationToUser(device.userId.toString(), title, body, {
        type: "low_moisture",
        deviceId,
        moistureLevel: String(moistureLevel),
        locationName: locationDisplayName,
      });
    } catch (error) {
      console.error("Error sending low moisture notifications:", error);
    }
  }

  /**
   * Helper to get device with user info
   */
  private async getDeviceWithUser(deviceId: string): Promise<any> {
    // You'll need to implement this based on your data structure
    // This is a placeholder that returns the device with user info
    const Device = require("../models/device").Device;
    const device = await Device.findOne({ deviceId });
    return device;
  }
}

export const notificationService = new NotificationService();
