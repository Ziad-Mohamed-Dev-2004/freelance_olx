import { Request, Response } from 'express';
import categoryService from '../services/category.service';
import cloudinaryService from '../services/cloudinary.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { CreateCategoryInput, UpdateCategoryInput } from '../types/category.types';

const resolveCategoryImage = async (
  file: Express.Multer.File | undefined,
  imageUrl?: string,
): Promise<string | undefined> => {
  if (file) {
    const uploaded = await cloudinaryService.uploadImage(file, 'categories');
    return uploaded.url;
  }

  if (imageUrl === '') {
    return '';
  }

  return imageUrl;
};

/**
 * POST /categories
 * Creates a new category (Admin only).
 */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const image = await resolveCategoryImage(req.file, req.body.image);

  const category = await categoryService.createCategory({
    ...(req.body as CreateCategoryInput),
    image,
  });

  ApiResponse.success(res, 201, 'Category created successfully', category);
});

/**
 * GET /categories
 * Retrieves a paginated list of categories with optional search and filters.
 */
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    search: req.query.search as string,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
    sort: req.query.sort as string,
    isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    parentCategory: req.query.parentCategory as string,
  };

  const result = await categoryService.getCategories(filters);
  ApiResponse.success(res, 200, 'Categories retrieved successfully', result);
});

/**
 * GET /categories/:id
 * Retrieves a category by ID.
 */
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const category = await categoryService.getCategoryById(id);
  ApiResponse.success(res, 200, 'Category retrieved successfully', category);
});

/**
 * PUT /categories/:id
 * Updates a category by ID (Admin only).
 */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const image = await resolveCategoryImage(req.file, req.body.image);

  const updateInput: UpdateCategoryInput = { ...(req.body as UpdateCategoryInput) };

  if (image !== undefined) {
    updateInput.image = image;
  }

  const category = await categoryService.updateCategory(id, updateInput);
  ApiResponse.success(res, 200, 'Category updated successfully', category);
});

/**
 * DELETE /categories/:id
 * Soft deletes a category by ID (Admin only).
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const category = await categoryService.deleteCategory(id);
  ApiResponse.success(res, 200, 'Category deleted successfully', category);
});

/**
 * PATCH /categories/:id/restore
 * Restores a soft-deleted category by ID (Admin only).
 */
export const restoreCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const category = await categoryService.restoreCategory(id);
  ApiResponse.success(res, 200, 'Category restored successfully', category);
});

export const activateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const category = await categoryService.updateCategory(id, { isActive: true });
  ApiResponse.success(res, 200, 'Category activated successfully', category);
});

export const deactivateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const category = await categoryService.updateCategory(id, { isActive: false });
  ApiResponse.success(res, 200, 'Category deactivated successfully', category);
});
