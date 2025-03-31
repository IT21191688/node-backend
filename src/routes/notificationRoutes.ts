// src/routes/notificationRoutes.ts
import { Router } from "express";
import { NotificationController } from "../controllers/notificationController";
import { authenticateJWT } from "../middleware/auth";
import { rateLimiters } from "../middleware/rateLimiter";

const router = Router();
const notificationController = new NotificationController();

// Apply authentication to all routes
router.use(authenticateJWT);

// Apply rate limiting
router.use(rateLimiters.public);

// Register device token for push notifications
router.post("/register-token", notificationController.registerDeviceToken);

// Remove device token
router.post("/remove-token", notificationController.removeDeviceToken);

// Update notification preferences
router.put(
  "/preferences",
  notificationController.updateNotificationPreferences
);

// Get notification preferences
router.get("/preferences", notificationController.getNotificationPreferences);

// Send test notification
router.post("/test", notificationController.sendTestNotification);

export default router;
