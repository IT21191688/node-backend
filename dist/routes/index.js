"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
router.use(rateLimiter_1.rateLimiters.public);
router.use('/v1/auth', authRoutes_1.default);
router.use('/v1/users', userRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map