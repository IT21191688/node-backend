// src/controllers/notificationController.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { notificationService } from "../services/notificationService";

export class NotificationController {
  /**
   * Register a device token
   */
  registerToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { token, device } = req.body;

      if (!token) {
        res.status(400).json({
          status: "fail",
          message: "Device token is required",
        });
        return;
      }

      await notificationService.registerDeviceToken(req.user.id, token, device);

      res.status(200).json({
        status: "success",
        message: "Device token registered successfully",
      });
    }
  );

  /**
   * Unregister a device token
   */
  unregisterToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          status: "fail",
          message: "Device token is required",
        });
        return;
      }

      await notificationService.removeDeviceToken(token);

      res.status(200).json({
        status: "success",
        message: "Device token unregistered successfully",
      });
    }
  );

  /**
   * Test notification (development only)
   */
  testNotification = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { title, body, data } = req.body;

      if (!title || !body) {
        res.status(400).json({
          status: "fail",
          message: "Title and body are required",
        });
        return;
      }

      await notificationService.sendNotificationToUser(
        req.user.id,
        title,
        body,
        data
      );

      res.status(200).json({
        status: "success",
        message: "Test notification sent successfully",
      });
    }
  );
}
