"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationHelpers = exports.validateScheduleUpdate = exports.validateScheduleQuery = exports.validateWateringSchedule = void 0;
const errorHandler_1 = require("./errorHandler");
const isValidDate = (date) => {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
};
const isValidMoistureLevel = (moisture) => {
    return typeof moisture === 'number' && moisture >= 0 && moisture <= 100;
};
const isValidTemperature = (temp) => {
    return typeof temp === 'number' && temp >= -10 && temp <= 50;
};
const isValidHumidity = (humidity) => {
    return typeof humidity === 'number' && humidity >= 0 && humidity <= 100;
};
const isValidRainfall = (rainfall) => {
    return typeof rainfall === 'number' && rainfall >= 0 && rainfall <= 1000;
};
const isValidPlantAge = (age) => {
    return typeof age === 'number' && age >= 0 && age <= 100;
};
const isValidSoilType = (soilType) => {
    const validSoilTypes = [
        'Lateritic',
        'Sandy Loam',
        'Cinnamon Sand',
        'Red Yellow Podzolic',
        'Alluvial'
    ];
    return validSoilTypes.includes(soilType);
};
const isValidStatus = (status) => {
    const validStatuses = ['pending', 'completed', 'skipped'];
    return validStatuses.includes(status);
};
const validateWateringSchedule = (req, res, next) => {
    const errors = [];
    const { date, soilConditions, weatherConditions, plantAge, status } = req.body;
    if (!date || !isValidDate(date)) {
        errors.push({
            field: 'date',
            message: 'Please provide a valid date'
        });
    }
    if (!soilConditions || typeof soilConditions !== 'object') {
        errors.push({
            field: 'soilConditions',
            message: 'Soil conditions are required'
        });
    }
    else {
        ['moisture10cm', 'moisture20cm', 'moisture30cm'].forEach(field => {
            if (!isValidMoistureLevel(soilConditions[field])) {
                errors.push({
                    field: `soilConditions.${field}`,
                    message: `${field} must be a number between 0 and 100`
                });
            }
        });
        if (!isValidSoilType(soilConditions.soilType)) {
            errors.push({
                field: 'soilConditions.soilType',
                message: 'Invalid soil type'
            });
        }
    }
    if (!weatherConditions || typeof weatherConditions !== 'object') {
        errors.push({
            field: 'weatherConditions',
            message: 'Weather conditions are required'
        });
    }
    else {
        if (!isValidTemperature(weatherConditions.temperature)) {
            errors.push({
                field: 'weatherConditions.temperature',
                message: 'Temperature must be between -10 and 50 degrees Celsius'
            });
        }
        if (!isValidHumidity(weatherConditions.humidity)) {
            errors.push({
                field: 'weatherConditions.humidity',
                message: 'Humidity must be between 0 and 100 percent'
            });
        }
        if (!isValidRainfall(weatherConditions.rainfall)) {
            errors.push({
                field: 'weatherConditions.rainfall',
                message: 'Rainfall must be between 0 and 1000 mm'
            });
        }
    }
    if (!isValidPlantAge(plantAge)) {
        errors.push({
            field: 'plantAge',
            message: 'Plant age must be between 0 and 100 years'
        });
    }
    if (status && !isValidStatus(status)) {
        errors.push({
            field: 'status',
            message: 'Invalid status. Must be one of: pending, completed, skipped'
        });
    }
    if (errors.length > 0) {
        return next(new errorHandler_1.AppError(400, 'Validation failed', errors));
    }
    next();
};
exports.validateWateringSchedule = validateWateringSchedule;
const validateScheduleQuery = (req, res, next) => {
    const errors = [];
    const { startDate, endDate, status } = req.query;
    if (startDate && !isValidDate(startDate)) {
        errors.push({
            field: 'startDate',
            message: 'Please provide a valid start date'
        });
    }
    if (endDate && !isValidDate(endDate)) {
        errors.push({
            field: 'endDate',
            message: 'Please provide a valid end date'
        });
    }
    if (status && !isValidStatus(status)) {
        errors.push({
            field: 'status',
            message: 'Invalid status. Must be one of: pending, completed, skipped'
        });
    }
    if (errors.length > 0) {
        return next(new errorHandler_1.AppError(400, 'Validation failed', errors));
    }
    next();
};
exports.validateScheduleQuery = validateScheduleQuery;
const validateScheduleUpdate = (req, res, next) => {
    const errors = [];
    const { status, actualAmount, notes } = req.body;
    if (status && !isValidStatus(status)) {
        errors.push({
            field: 'status',
            message: 'Invalid status. Must be one of: pending, completed, skipped'
        });
    }
    if (actualAmount !== undefined) {
        if (typeof actualAmount !== 'number' || actualAmount < 0) {
            errors.push({
                field: 'actualAmount',
                message: 'Actual amount must be a positive number'
            });
        }
    }
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
        errors.push({
            field: 'notes',
            message: 'Notes must be a string with maximum length of 500 characters'
        });
    }
    if (errors.length > 0) {
        return next(new errorHandler_1.AppError(400, 'Validation failed', errors));
    }
    next();
};
exports.validateScheduleUpdate = validateScheduleUpdate;
exports.validationHelpers = {
    isValidDate,
    isValidMoistureLevel,
    isValidTemperature,
    isValidHumidity,
    isValidRainfall,
    isValidPlantAge,
    isValidSoilType,
    isValidStatus
};
//# sourceMappingURL=wateringValidation.js.map