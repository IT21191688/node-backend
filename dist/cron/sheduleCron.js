"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const wateringService_1 = require("../services/wateringService");
class ScheduleCron {
    constructor() {
        this.wateringService = new wateringService_1.WateringService();
        this.initCronJobs();
    }
    initCronJobs() {
        node_cron_1.default.schedule('0 6 * * *', async () => {
            console.log('Starting daily schedule creation...');
            try {
                await this.wateringService.createDailySchedules();
                console.log('Daily schedule creation completed successfully');
            }
            catch (error) {
                console.error('Error in cron job:', error);
            }
        });
    }
}
exports.ScheduleCron = ScheduleCron;
//# sourceMappingURL=sheduleCron.js.map