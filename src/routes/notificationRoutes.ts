import express from "express";
import { notificationController } from "../controllers/notificationController";

const router = express.Router();

router.post("/update-token", notificationController.updateFcmToken);

router.post("/test", notificationController.testNotification);

router.post("/test-moisture", notificationController.testMoistureNotification);

router.post("/check-moisture", notificationController.triggerMoistureCheck);

export default router;
