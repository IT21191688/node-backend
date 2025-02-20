import { Router } from 'express';
import { LocationController } from '../controllers/locationController';
import { authenticateJWT } from '../middleware/auth';
import { validateLocation } from '../middleware/locationDeviceValidation';
import { rateLimiters } from '../middleware/rateLimiter';

const router = Router();
const locationController = new LocationController();

// Apply authentication to all routes
router.use(authenticateJWT);

// Apply rate limiting
router.use(rateLimiters.public);

// Location CRUD operations
router.post(
    '/',
    validateLocation,
    locationController.createLocation
);

router.get(
    '/',
    locationController.getLocations
);

router.get(
    '/:id',
    locationController.getLocationById
);

router.put(
    '/:id',
    validateLocation,
    locationController.updateLocation
);

router.delete(
    '/:id',
    locationController.deleteLocation
);

export default router;
