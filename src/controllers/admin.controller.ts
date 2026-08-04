import { Request } from 'express';
import adminDashboardService from '../services/admin-dashboard.service';
import adminUserService from '../services/admin-user.service';
import adminLogService from '../services/admin-log.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { AnalyticsPeriod } from '../types/admin.types';
import { UserRole, UserStatus } from '../interfaces/user.interface';

const param = (req: Request, key: string) =>
  Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key];

const userQuery = (req: Request) => ({
  page: Number(req.query.page || 1),
  limit: Number(req.query.limit || 10),
  sort: req.query.sort as 'newest' | 'oldest' | undefined,
  search: req.query.search as string | undefined,
  role: req.query.role as UserRole | undefined,
  status: req.query.status as UserStatus | undefined,
  verified: req.query.verified as 'true' | 'false' | undefined,
  createdFrom: req.query.createdFrom as string | undefined,
  createdTo: req.query.createdTo as string | undefined,
});

const analyticsQuery = (req: Request) => ({
  period: (req.query.period as AnalyticsPeriod) || 'daily',
  startDate: req.query.startDate as string | undefined,
  endDate: req.query.endDate as string | undefined,
});

export const getDashboardStats = asyncHandler(async (_req, res) =>
  ApiResponse.success(
    res,
    200,
    'Dashboard statistics retrieved successfully',
    await adminDashboardService.getDashboardStats(),
  ),
);

export const getAnalytics = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Analytics retrieved successfully',
    await adminDashboardService.getAnalytics(analyticsQuery(req)),
  ),
);

export const getRecentActivity = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Recent dashboard activity retrieved successfully',
    await adminDashboardService.getRecentActivity(
      req.query.limit ? Number(req.query.limit) : undefined,
    ),
  ),
);

export const getAdminLogs = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Admin logs retrieved successfully',
    await adminLogService.getAll({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      sort: req.query.sort as 'newest' | 'oldest' | undefined,
      search: req.query.search as string | undefined,
      action: req.query.action as string | undefined,
    }),
  ),
);

export const getUsers = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Users retrieved successfully',
    await adminUserService.getAll(userQuery(req)),
  ),
);

export const getUser = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'User retrieved successfully',
    await adminUserService.getById(param(req, 'id')),
  ),
);

export const updateUser = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'User updated successfully',
    await adminUserService.update(param(req, 'id'), req.body, req.user!._id.toString()),
  ),
);

export const blockUser = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'User blocked successfully',
    await adminUserService.block(param(req, 'id'), req.user!._id.toString()),
  ),
);

export const unblockUser = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'User unblocked successfully',
    await adminUserService.unblock(param(req, 'id'), req.user!._id.toString()),
  ),
);

export const suspendUser = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'User suspended successfully',
    await adminUserService.suspend(param(req, 'id'), req.user!._id.toString()),
  ),
);

export const activateUser = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'User activated successfully',
    await adminUserService.activate(param(req, 'id'), req.user!._id.toString()),
  ),
);

export const deleteUser = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'User deleted successfully',
    await adminUserService.deleteUser(param(req, 'id'), req.user!._id.toString()),
  ),
);

export const restoreUser = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'User restored successfully',
    await adminUserService.restore(param(req, 'id'), req.user!._id.toString()),
  ),
);

export const resetUserPassword = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'User password reset successfully',
    await adminUserService.resetPassword(param(req, 'id'), req.body, req.user!._id.toString()),
  ),
);

export const changeUserRole = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'User role updated successfully',
    await adminUserService.changeRole(param(req, 'id'), req.body, req.user!._id.toString()),
  ),
);
