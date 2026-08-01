import { Request, Response } from 'express';
import cityService from '../services/city.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * POST /cities
 * Creates a new city (Admin only).
 */
export const createCity = asyncHandler(async (req: Request, res: Response) => {
  const city = await cityService.createCity(req.body);
  ApiResponse.success(res, 201, 'City created successfully', city);
});

/**
 * GET /cities
 * Retrieves a paginated list of cities with optional search and filters.
 */
export const getCities = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    search: req.query.search as string,
    governorate: req.query.governorate as string,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
    sort: req.query.sort as string,
    isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
  };

  const result = await cityService.getCities(filters);
  ApiResponse.success(res, 200, 'Cities retrieved successfully', result);
});

/**
 * GET /cities/:id
 * Retrieves a city by ID.
 */
export const getCityById = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const city = await cityService.getCityById(id);
  ApiResponse.success(res, 200, 'City retrieved successfully', city);
});

/**
 * PUT /cities/:id
 * Updates a city by ID (Admin only).
 */
export const updateCity = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const city = await cityService.updateCity(id, req.body);
  ApiResponse.success(res, 200, 'City updated successfully', city);
});

/**
 * DELETE /cities/:id
 * Soft deletes a city by ID (Admin only).
 */
export const deleteCity = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const city = await cityService.deleteCity(id);
  ApiResponse.success(res, 200, 'City deleted successfully', city);
});

/**
 * PATCH /cities/:id/restore
 * Restores a soft-deleted city by ID (Admin only).
 */
export const restoreCity = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const city = await cityService.restoreCity(id);
  ApiResponse.success(res, 200, 'City restored successfully', city);
});

export const activateCity = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  ApiResponse.success(
    res,
    200,
    'City activated successfully',
    await cityService.updateCity(id, { isActive: true }),
  );
});
export const deactivateCity = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  ApiResponse.success(
    res,
    200,
    'City deactivated successfully',
    await cityService.updateCity(id, { isActive: false }),
  );
});
