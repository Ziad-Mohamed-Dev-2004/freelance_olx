import { Request, Response } from 'express';
import favoriteService from '../services/favorite.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
const propertyId = (req: Request) =>
  Array.isArray(req.params.propertyId) ? req.params.propertyId[0] : req.params.propertyId;
const query = (req: Request) => ({
  page: Number(req.query.page || 1),
  limit: Number(req.query.limit || 10),
  sort: req.query.sort as 'newest' | 'oldest',
});
export const addFavorite = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    201,
    'Property added to favorites',
    await favoriteService.add(req.user!._id.toString(), propertyId(req)),
  ),
);
export const removeFavorite = asyncHandler(async (req, res) => {
  await favoriteService.remove(req.user!._id.toString(), propertyId(req));
  ApiResponse.success(res, 200, 'Property removed from favorites');
});
export const getFavorites = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Favorites retrieved successfully',
    await favoriteService.getFavorites(req.user!._id.toString(), query(req)),
  ),
);
export const checkFavorite = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    200,
    'Favorite status retrieved successfully',
    await favoriteService.check(req.user!._id.toString(), propertyId(req)),
  ),
);
