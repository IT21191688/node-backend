"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ActualYield_1 = __importDefault(require("../models/ActualYield"));
class ActualYieldService {
    async createActualYield(data, userId, locationId) {
        const actualYield = new ActualYield_1.default({
            ...data,
            user: userId,
            location: locationId,
        });
        await actualYield.save();
        return actualYield;
    }
    async getActualYieldsByUser(userId) {
        return ActualYield_1.default.find({ user: userId });
    }
    async getActualYieldById(id) {
        return ActualYield_1.default.findById(id);
    }
    async deleteActualYield(id) {
        return ActualYield_1.default.deleteOne({ _id: id });
    }
    async getActualYieldsByYearAndLocation(userId, year, locationId) {
        return ActualYield_1.default.find({ user: userId, year, location: locationId });
    }
}
exports.default = new ActualYieldService();
//# sourceMappingURL=ActualYieldService.js.map