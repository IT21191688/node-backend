"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const locationService_1 = require("../services/locationService");
const errorHandler_1 = require("../middleware/errorHandler");
class LocationController {
    constructor() {
        this.createLocation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const location = await this.locationService.createLocation(req.user.id, req.body);
            res.status(201).json({
                status: 'success',
                data: { location }
            });
        });
        this.getLocations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const locations = await this.locationService.getLocations(req.user.id);
            res.status(200).json({
                status: 'success',
                data: { locations }
            });
        });
        this.getLocationById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const location = await this.locationService.getLocationById(req.params.id, req.user.id);
            res.status(200).json({
                status: 'success',
                data: { location }
            });
        });
        this.updateLocation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const location = await this.locationService.updateLocation(req.params.id, req.user.id, req.body);
            res.status(200).json({
                status: 'success',
                data: { location }
            });
        });
        this.deleteLocation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            await this.locationService.deleteLocation(req.params.id, req.user.id);
            res.status(204).json({
                status: 'success',
                data: null
            });
        });
        this.locationService = new locationService_1.LocationService();
    }
}
exports.LocationController = LocationController;
//# sourceMappingURL=locationController.js.map