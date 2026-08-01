import { Request } from 'express';
import propertyEngagementService from '../services/property-engagement.service';
import conversationService from '../services/conversation.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
const id = (req: Request, key = 'id') =>
  Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key];
const query = (req: Request) => ({
  page: Number(req.query.page || 1),
  limit: Number(req.query.limit || 10),
  sort: req.query.sort as 'newest' | 'oldest',
});
export const listReviews = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Reviews retrieved successfully',
    await propertyEngagementService.getReviews(id(req), query(req)),
  ),
);
export const createReview = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    201,
    'Review created successfully',
    await propertyEngagementService.addReview(
      req.user!._id.toString(),
      id(req),
      req.body.rating,
      req.body.comment,
    ),
  ),
);
export const updateReview = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Review updated successfully',
    await propertyEngagementService.updateReview(
      req.user!._id.toString(),
      id(req, 'reviewId'),
      req.body.rating,
      req.body.comment,
    ),
  ),
);
export const deleteReview = asyncHandler(async (req, res) => {
  await propertyEngagementService.deleteReview(req.user!._id.toString(), id(req, 'reviewId'));
  ApiResponse.success(res, 200, 'Review deleted successfully');
});
export const createSavedSearch = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    201,
    'Saved search created successfully',
    await propertyEngagementService.createSavedSearch(req.user!._id.toString(), req.body),
  ),
);
export const getSavedSearches = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Saved searches retrieved successfully',
    await propertyEngagementService.getSavedSearches(req.user!._id.toString()),
  ),
);
export const updateSavedSearch = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Saved search updated successfully',
    await propertyEngagementService.updateSavedSearch(req.user!._id.toString(), id(req), req.body),
  ),
);
export const deleteSavedSearch = asyncHandler(async (req, res) => {
  await propertyEngagementService.deleteSavedSearch(req.user!._id.toString(), id(req));
  ApiResponse.success(res, 200, 'Saved search deleted successfully');
});
export const getRecentlyViewed = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Recently viewed properties retrieved successfully',
    await propertyEngagementService.getRecentlyViewed(req.user!._id.toString(), query(req)),
  ),
);
export const shareProperty = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Property share link created successfully',
    await propertyEngagementService.shareProperty(
      req.user?._id.toString(),
      id(req),
      req.body,
      `${req.protocol}://${req.get('host')}/properties/${id(req)}`,
    ),
  ),
);
export const contactOwner = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    201,
    'Conversation ready',
    await conversationService.start(req.user!._id.toString(), id(req)),
  ),
);
