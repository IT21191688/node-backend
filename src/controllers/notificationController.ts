import { Request, Response } from "express";
import { notificationService } from "../services/notificationService";
import { Device } from "../models/device";
import { User } from "../models/user";
import { Location } from "../models/location";
import { firebaseService } from "../config/firebase";

export class NotificationController {
  /**
   * Test sending a notification to a user
   * @route POST /api/notifications/test
   * @access Private (admin)
   */
  async testNotification(req: Request, res: Response) {
    try {
      const { userId, title, body, data } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Find user to verify existence and get FCM token
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.fcmToken) {
        return res.status(400).json({
          success: false,
          message: "User does not have an FCM token registered",
        });
      }

      // Default title and body if not provided
      const notificationTitle = title || "Test Notification";
      const notificationBody =
        body || "This is a test notification from your coconut farm app.";

      await notificationService.sendNotificationToUser(
        userId,
        notificationTitle,
        notificationBody,
        data || {}
      );

      return res.status(200).json({
        success: true,
        message: "Test notification sent successfully",
        fcmToken: user.fcmToken,
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      return res.status(500).json({
        success: false,
        message: "Error sending test notification",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Test sending a low moisture notification for a device
   * @route POST /api/notifications/test-moisture
   * @access Private (admin)
   */
  async testMoistureNotification(req: Request, res: Response) {
    try {
      const { deviceId, moistureLevel } = req.body;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: "Device ID is required",
        });
      }

      // Find device to verify existence
      const device = await Device.findOne({ deviceId });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      // Find user to verify they have FCM token
      const user = await User.findById(device.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Device owner not found",
        });
      }

      if (!user.fcmToken) {
        return res.status(400).json({
          success: false,
          message: "Device owner does not have an FCM token registered",
        });
      }

      // Find location for better notification context
      const location = await Location.findOne({ deviceId });
      const locationName = location ? location.name : "your farm";

      // Use provided moisture level or default to 25%
      const moisture = moistureLevel || 25;

      await notificationService.sendLowMoistureLevelNotifications(
        deviceId,
        locationName,
        moisture
      );

      return res.status(200).json({
        success: true,
        message: "Test moisture notification sent successfully",
        details: {
          deviceId,
          userId: user._id,
          fcmToken: user.fcmToken,
          moistureLevel: moisture,
          location: locationName,
        },
      });
    } catch (error) {
      console.error("Error sending test moisture notification:", error);
      return res.status(500).json({
        success: false,
        message: "Error sending test moisture notification",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Manually trigger moisture check for all devices
   * @route POST /api/notifications/check-moisture
   * @access Private (admin)
   */
  async triggerMoistureCheck(req: Request, res: Response) {
    try {
      // Get all active soil sensor devices
      const devices = await Device.find({
        isActive: true,
        status: "active",
        type: "soil_sensor",
      });

      if (devices.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No active soil sensor devices found",
        });
      }

      const results = [];
      const MOISTURE_THRESHOLD = 30; // Same threshold as in the cron job

      for (const device of devices) {
        try {
          // Get actual readings from Firebase
          const readings = await firebaseService.getSoilMoistureReadings(
            device.deviceId
          );

          if (!readings) {
            results.push({
              deviceId: device.deviceId,
              status: "error",
              message: "No readings available",
            });
            continue;
          }

          // Calculate average moisture
          const avgMoisture =
            (readings.moisture10cm +
              readings.moisture20cm +
              readings.moisture30cm) /
            3;

          // Check if moisture is below threshold
          if (avgMoisture < MOISTURE_THRESHOLD) {
            // Get location name
            const location = await Location.findOne({
              deviceId: device.deviceId,
            });
            const locationName = location ? location.name : "your farm";

            // Find user
            const user = await User.findById(device.userId);

            if (!user || !user.fcmToken) {
              results.push({
                deviceId: device.deviceId,
                moistureLevel: avgMoisture.toFixed(1),
                location: locationName,
                status: "warning",
                message: "Low moisture detected but user has no FCM token",
              });
              continue;
            }

            // Send notification
            await notificationService.sendLowMoistureLevelNotifications(
              device.deviceId,
              locationName,
              Math.round(avgMoisture)
            );

            results.push({
              deviceId: device.deviceId,
              moistureLevel: avgMoisture.toFixed(1),
              location: locationName,
              userId: user._id,
              notificationSent: true,
              status: "success",
              message: "Low moisture notification sent",
            });
          } else {
            results.push({
              deviceId: device.deviceId,
              moistureLevel: avgMoisture.toFixed(1),
              notificationSent: false,
              status: "info",
              message: "Moisture level above threshold",
            });
          }
        } catch (error) {
          results.push({
            deviceId: device.deviceId,
            status: "error",
            message: (error as Error).message,
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "Manual moisture check completed",
        devicesChecked: devices.length,
        results,
      });
    } catch (error) {
      console.error("Error triggering moisture check:", error);
      return res.status(500).json({
        success: false,
        message: "Error triggering moisture check",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Update user FCM token manually
   * @route POST /api/notifications/update-token
   * @access Private
   */
  async updateFcmToken(req: Request, res: Response) {
    try {
      const { fcmToken } = req.body;
      const userId = req.user._id;

      if (!fcmToken) {
        return res.status(400).json({
          success: false,
          message: "FCM token is required",
        });
      }

      // Update user's FCM token
      await User.findByIdAndUpdate(userId, { fcmToken });

      return res.status(200).json({
        success: true,
        message: "FCM token updated successfully",
      });
    } catch (error) {
      console.error("Error updating FCM token:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating FCM token",
        error: (error as Error).message,
      });
    }
  }
}

export const notificationController = new NotificationController();
