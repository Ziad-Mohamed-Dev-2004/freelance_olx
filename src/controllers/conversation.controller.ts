import { Request } from 'express';
import conversationService from '../services/conversation.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
const param = (req: Request, key: string) =>
  Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key];
const query = (req: Request) => ({
  page: Number(req.query.page || 1),
  limit: Number(req.query.limit || 20),
});
export const start = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    201,
    'Conversation ready',
    await conversationService.start(
      req.user!._id.toString(),
      req.body.propertyId,
      req.body.recipientId,
    ),
  ),
);
export const list = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Conversations retrieved successfully',
    await conversationService.list(req.user!._id.toString(), query(req)),
  ),
);
export const get = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Conversation retrieved successfully',
    await conversationService.get(param(req, 'conversationId'), req.user!._id.toString()),
  ),
);
export const remove = asyncHandler(async (req, res) => {
  await conversationService.remove(param(req, 'conversationId'), req.user!._id.toString());
  ApiResponse.success(res, 200, 'Conversation deleted successfully');
});
