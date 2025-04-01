// src/routes/notificationRoutes.ts
import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { NotificationController } from "../controllers/notificationController";
import { rateLimiters } from "../middleware/rateLimiter";

const router = Router();
const notificationController = new NotificationController();

// Apply authentication to all routes
router.use(authenticateJWT);

// Apply rate limiting
router.use(rateLimiters.public);

// Register device token
router.post("/register-token", notificationController.registerToken);

// Unregister device token
router.delete("/unregister-token", notificationController.unregisterToken);

// Test route (for development only)
router.post("/test-notification", notificationController.testNotification);

export default router;
