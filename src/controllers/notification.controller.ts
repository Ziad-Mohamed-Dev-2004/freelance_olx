import { Request } from 'express';
import notificationService from '../services/notification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
const id = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
const query = (req: Request) => ({
  page: Number(req.query.page || 1),
  limit: Number(req.query.limit || 20),
});
export const list = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Notifications retrieved successfully',
    await notificationService.getForUser(req.user!._id.toString(), query(req)),
  ),
);
export const markRead = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Notification marked as read',
    await notificationService.markRead(id(req), req.user!._id.toString()),
  ),
);
export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user!._id.toString());
  ApiResponse.success(res, 200, 'All notifications marked as read');
});
export const remove = asyncHandler(async (req, res) => {
  await notificationService.remove(id(req), req.user!._id.toString());
  ApiResponse.success(res, 200, 'Notification deleted');
});
