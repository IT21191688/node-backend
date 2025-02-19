"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WateringController = void 0;
const wateringService_1 = require("../services/wateringService");
const errorHandler_1 = require("../middleware/errorHandler");
class WateringController {
    constructor() {
        this.createSchedule = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const schedule = await this.wateringService.createSchedule(req.user.id, req.body);
            res.status(201).json({
                status: 'success',
                data: { schedule }
            });
        });
        this.getSchedules = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const schedules = await this.wateringService.getSchedules(req.user.id, req.query);
            res.status(200).json({
                status: 'success',
                data: { schedules }
            });
        });
        this.getScheduleById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const schedule = await this.wateringService.getScheduleById(req.params.id, req.user.id);
            res.status(200).json({
                status: 'success',
                data: { schedule }
            });
        });
        this.updateSchedule = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const schedule = await this.wateringService.updateSchedule(req.params.id, req.user.id, req.body);
            res.status(200).json({
                status: 'success',
                data: { schedule }
            });
        });
        this.deleteSchedule = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            await this.wateringService.deleteSchedule(req.params.id, req.user.id);
            res.status(204).json({
                status: 'success',
                data: null
            });
        });
        this.wateringService = new wateringService_1.WateringService();
    }
}
exports.WateringController = WateringController;
//# sourceMappingURL=wateringController.js.map