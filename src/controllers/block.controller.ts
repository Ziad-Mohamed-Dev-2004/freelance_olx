import { Request } from 'express';
import blockService from '../services/block.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
const userId = (req: Request) =>
  Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
const query = (req: Request) => ({
  page: Number(req.query.page || 1),
  limit: Number(req.query.limit || 10),
  sort: req.query.sort as 'newest' | 'oldest',
});
export const blockUser = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    201,
    'User blocked successfully',
    await blockService.block(req.user!._id.toString(), userId(req)),
  ),
);
export const unblockUser = asyncHandler(async (req, res) => {
  await blockService.unblock(req.user!._id.toString(), userId(req));
  ApiResponse.success(res, 200, 'User unblocked successfully');
});
export const getBlocks = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Blocked users retrieved successfully',
    await blockService.getBlocks(req.user!._id.toString(), query(req)),
  ),
);
export const checkBlock = asyncHandler(async (req, res) =>
  ApiResponse.success(res, 200, 'Block status retrieved successfully', {
    isBlocked: await blockService.isBlocked(req.user!._id.toString(), userId(req)),
  }),
);
