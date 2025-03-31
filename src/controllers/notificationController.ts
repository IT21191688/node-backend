// src/controllers/notificationController.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { User } from "../models/user";
import { notificationService } from "../services/notificationService";

export class NotificationController {
  /**
   * Register a device token for push notifications
   */
  registerDeviceToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "FCM token is required",
      });
    }

    // Find the user and add the token if it doesn't exist
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { fcmTokens: token } }, // addToSet prevents duplicates
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "Device token registered successfully",
      data: {
        token,
      },
    });
  });

  /**
   * Remove a device token
   */
  removeDeviceToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "FCM token is required",
      });
    }

    // Find the user and remove the token
    await User.findByIdAndUpdate(req.user.id, { $pull: { fcmTokens: token } });

    res.status(200).json({
      status: "success",
      message: "Device token removed successfully",
    });
  });

  /**
   * Update notification preferences
   */
  updateNotificationPreferences = asyncHandler(
    async (req: Request, res: Response) => {
      const { moistureAlerts, batteryAlerts, wateringReminders } = req.body;

      // Update only the provided preferences
      const updateData: any = {};

      if (moistureAlerts !== undefined) {
        updateData["notificationPreferences.moistureAlerts"] = moistureAlerts;
      }

      if (batteryAlerts !== undefined) {
        updateData["notificationPreferences.batteryAlerts"] = batteryAlerts;
      }

      if (wateringReminders !== undefined) {
        updateData["notificationPreferences.wateringReminders"] =
          wateringReminders;
      }

      // Only update if there's something to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          status: "error",
          message: "No preferences provided for update",
        });
      }

      // Update the user preferences
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true }
      );

      res.status(200).json({
        status: "success",
        message: "Notification preferences updated successfully",
        data: {
          notificationPreferences: user?.notificationPreferences,
        },
      });
    }
  );

  /**
   * Get notification preferences
   */
  getNotificationPreferences = asyncHandler(
    async (req: Request, res: Response) => {
      const user = await User.findById(req.user.id);

      res.status(200).json({
        status: "success",
        data: {
          notificationPreferences: user?.notificationPreferences,
        },
      });
    }
  );

  /**
   * Send a test notification
   */
  sendTestNotification = asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.sendToUser(req.user.id, {
      title: "Test Notification",
      body: "This is a test notification from your MoistureSense system",
      data: {
        type: "test_notification",
        timestamp: new Date().toISOString(),
      },
    });

    if (result) {
      res.status(200).json({
        status: "success",
        message: "Test notification sent successfully",
      });
    } else {
      res.status(400).json({
        status: "error",
        message:
          "Failed to send test notification. Make sure you have registered a device token.",
      });
    }
  });
}
