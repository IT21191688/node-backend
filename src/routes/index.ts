import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import waterRoutes from './wateringRoutes';
import locationRoutes from './locationRoutes';
import deviceRoutes from './deviceRoutes';
import yieldPredictionRoutes from './yieldPredictionRoutes';
import { rateLimiters } from '../middleware/rateLimiter';

const router = Router();

// Health check route
router.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Apply rate limiter to all routes
router.use(rateLimiters.public);

// Mount routes - removing the /api prefix as it's added in app.ts
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/watering', waterRoutes);
router.use('/v1/locations', locationRoutes);
router.use('/v1/devices', deviceRoutes);
router.use('/v1/yield', yieldPredictionRoutes);

export default router;