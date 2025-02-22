﻿import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import waterRoutes from './wateringRoutes';
import locationRoutes from './locationRoutes';
import deviceRoutes from './deviceRoutes';
import { rateLimiters } from '../middleware/rateLimiter';

const router = Router();

router.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

router.use(rateLimiters.public);

router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/watering', waterRoutes);
router.use('/v1/locations', locationRoutes);
router.use('/v1/devices', deviceRoutes);

export default router;