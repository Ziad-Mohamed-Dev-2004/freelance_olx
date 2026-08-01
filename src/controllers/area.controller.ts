import { Request, Response } from 'express';
import areaService from '../services/area.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * POST /areas
 * Creates a new area (Admin only).
 */
export const createArea = asyncHandler(async (req: Request, res: Response) => {
  const area = await areaService.createArea(req.body);
  ApiResponse.success(res, 201, 'Area created successfully', area);
});

/**
 * GET /areas
 * Retrieves a paginated list of areas with optional search, city filter, and status filter.
 */
export const getAreas = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    search: req.query.search as string,
    city: req.query.city as string,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
    sort: req.query.sort as string,
    isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
  };

  const result = await areaService.getAreas(filters);
  ApiResponse.success(res, 200, 'Areas retrieved successfully', result);
});

/**
 * GET /areas/:id
 * Retrieves an area by ID with populated city details.
 */
export const getAreaById = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const area = await areaService.getAreaById(id);
  ApiResponse.success(res, 200, 'Area retrieved successfully', area);
});

/**
 * PUT /areas/:id
 * Updates an area by ID (Admin only).
 */
export const updateArea = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const area = await areaService.updateArea(id, req.body);
  ApiResponse.success(res, 200, 'Area updated successfully', area);
});

/**
 * DELETE /areas/:id
 * Soft deletes an area by ID (Admin only).
 */
export const deleteArea = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const area = await areaService.deleteArea(id);
  ApiResponse.success(res, 200, 'Area deleted successfully', area);
});

/**
 * PATCH /areas/:id/restore
 * Restores a soft-deleted area by ID (Admin only).
 */
export const restoreArea = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const area = await areaService.restoreArea(id);
  ApiResponse.success(res, 200, 'Area restored successfully', area);
});

export const activateArea = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  ApiResponse.success(
    res,
    200,
    'Area activated successfully',
    await areaService.updateArea(id, { isActive: true }),
  );
});
export const deactivateArea = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  ApiResponse.success(
    res,
    200,
    'Area deactivated successfully',
    await areaService.updateArea(id, { isActive: false }),
  );
});
