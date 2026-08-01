import { Request } from 'express';
import reportService from '../services/report.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
const param = (req: Request, key: string) =>
  Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key];
const query = (req: Request) => ({
  page: Number(req.query.page || 1),
  limit: Number(req.query.limit || 10),
  sort: req.query.sort as 'newest' | 'oldest',
  search: req.query.search as string | undefined,
  status: req.query.status as any,
  reason: req.query.reason as any,
});
export const reportProperty = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    201,
    'Property reported successfully',
    await reportService.reportProperty(
      req.user!._id.toString(),
      param(req, 'propertyId'),
      req.body,
    ),
  ),
);
export const reportUser = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    201,
    'User reported successfully',
    await reportService.reportUser(req.user!._id.toString(), param(req, 'userId'), req.body),
  ),
);
export const getMyReports = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Reports retrieved successfully',
    await reportService.getMine(req.user!._id.toString(), query(req)),
  ),
);
export const getReports = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Reports retrieved successfully',
    await reportService.getAll(query(req)),
  ),
);
export const getReport = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Report retrieved successfully',
    await reportService.getById(param(req, 'id')),
  ),
);
export const updateStatus = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Report status updated successfully',
    await reportService.updateStatus(
      param(req, 'id'),
      req.body.status,
      req.user!._id.toString(),
      req.body.adminNote,
    ),
  ),
);
export const resolveReport = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Report resolved successfully',
    await reportService.resolve(param(req, 'id'), req.user!._id.toString(), req.body.adminNote),
  ),
);
export const rejectReport = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Report rejected successfully',
    await reportService.reject(param(req, 'id'), req.user!._id.toString(), req.body.adminNote),
  ),
);
export const addAdminNote = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Report note updated successfully',
    await reportService.addAdminNote(param(req, 'id'), req.body.adminNote),
  ),
);
export const deleteReport = asyncHandler(async (req, res) => {
  await reportService.remove(param(req, 'id'));
  ApiResponse.success(res, 200, 'Report deleted successfully');
});
