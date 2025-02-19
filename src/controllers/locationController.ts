import { Request, Response } from 'express';
import { LocationService } from '../services/locationService';
import { asyncHandler } from '../middleware/errorHandler';

export class LocationController {
    private locationService: LocationService;

    constructor() {
        this.locationService = new LocationService();
    }

    createLocation = asyncHandler(async (req: Request, res: Response) => {
        const location = await this.locationService.createLocation(
            req.user.id,
            req.body
        );

        res.status(201).json({
            status: 'success',
            data: { location }
        });
    });

    getLocations = asyncHandler(async (req: Request, res: Response) => {
        const locations = await this.locationService.getLocations(req.user.id);

        res.status(200).json({
            status: 'success',
            data: { locations }
        });
    });

    getLocationById = asyncHandler(async (req: Request, res: Response) => {
        const location = await this.locationService.getLocationById(
            req.params.id,
            req.user.id
        );

        res.status(200).json({
            status: 'success',
            data: { location }
        });
    });

    updateLocation = asyncHandler(async (req: Request, res: Response) => {
        const location = await this.locationService.updateLocation(
            req.params.id,
            req.user.id,
            req.body
        );

        res.status(200).json({
            status: 'success',
            data: { location }
        });
    });

    deleteLocation = asyncHandler(async (req: Request, res: Response) => {
        await this.locationService.deleteLocation(
            req.params.id,
            req.user.id
        );

        res.status(204).json({
            status: 'success',
            data: null
        });
    });
}
