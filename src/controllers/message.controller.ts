import { Request } from 'express';
import messageService from '../services/message.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
const id = (req: Request) =>
  Array.isArray(req.params.conversationId)
    ? req.params.conversationId[0]
    : req.params.conversationId;
const query = (req: Request) => ({
  page: Number(req.query.page || 1),
  limit: Number(req.query.limit || 30),
});
export const send = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    201,
    'Message sent',
    (await messageService.send(id(req), req.user!._id.toString(), req.body)).message,
  ),
);
export const history = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Messages retrieved successfully',
    await messageService.history(id(req), req.user!._id.toString(), query(req)),
  ),
);
export const delivered = asyncHandler(async (req, res) => {
  await messageService.delivered(id(req), req.user!._id.toString());
  ApiResponse.success(res, 200, 'Messages marked as delivered');
});
export const seen = asyncHandler(async (req, res) => {
  await messageService.seen(id(req), req.user!._id.toString());
  ApiResponse.success(res, 200, 'Messages marked as seen');
});
