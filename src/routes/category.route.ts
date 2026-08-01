import express from 'express';
import * as categoryController from '../controllers/category.controller';
import { validate } from '../middlewares/validate.middleware';
import * as categoryValidation from '../validators/category.validation';
import { auth, authorize } from '../middlewares/auth.middleware';
import { uploadSingleImage } from '../middlewares/upload.middleware';
import { normalizeCategoryFormData } from '../middlewares/parseFormData.middleware';

const router = express.Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Retrieve a paginated list of categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search category by name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field (e.g. createdAt:desc, name:asc)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: parentCategory
 *         schema:
 *           type: string
 *         description: Filter by parent category ID or null
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaginatedCategories'
 *   post:
 *     summary: Create a new category (Admin only)
 *     description: Send JSON with an image URL, or multipart/form-data with an image file upload.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Apartments
 *               icon:
 *                 type: string
 *                 example: building-icon
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file (JPEG, PNG, WEBP, GIF — max 5MB)
 *               parentCategory:
 *                 type: string
 *                 nullable: true
 *                 example: 64a1b2c3d4e5f67890abcdef
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         description: Validation error or invalid parent category
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router
  .route('/')
  .get(validate(categoryValidation.categoryQuerySchema), categoryController.getCategories)
  .post(
    auth,
    authorize('admin'),
    uploadSingleImage('image'),
    normalizeCategoryFormData,
    validate(categoryValidation.createCategorySchema),
    categoryController.createCategory,
  );

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CategoryResponse'
 *       404:
 *         description: Category not found
 *   put:
 *     summary: Update category by ID (Admin only)
 *     description: Send JSON with an image URL, or multipart/form-data with a new image file upload.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryInput'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Residential Apartments
 *               icon:
 *                 type: string
 *                 example: apartment-icon-updated
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New category image file (JPEG, PNG, WEBP, GIF — max 5MB)
 *               parentCategory:
 *                 type: string
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Category not found
 *   delete:
 *     summary: Soft delete category by ID (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Category not found
 */
router
  .route('/:id')
  .get(validate(categoryValidation.getCategoryByIdSchema), categoryController.getCategoryById)
  .put(
    auth,
    authorize('admin'),
    uploadSingleImage('image'),
    normalizeCategoryFormData,
    validate(categoryValidation.updateCategorySchema),
    categoryController.updateCategory,
  )
  .delete(
    auth,
    authorize('admin'),
    validate(categoryValidation.getCategoryByIdSchema),
    categoryController.deleteCategory,
  );

/**
 * @swagger
 * /categories/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category restored successfully
 *       400:
 *         description: Category is not deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Category not found
 */
router.patch(
  '/:id/restore',
  auth,
  authorize('admin'),
  validate(categoryValidation.getCategoryByIdSchema),
  categoryController.restoreCategory,
);

export default router;
