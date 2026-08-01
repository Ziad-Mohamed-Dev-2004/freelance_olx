import express from 'express';
import * as areaController from '../controllers/area.controller';
import { validate } from '../middlewares/validate.middleware';
import * as areaValidation from '../validators/area.validation';
import { auth, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /areas:
 *   get:
 *     summary: Retrieve a paginated list of areas with populated city details
 *     tags: [Areas]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search area by name
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by City ID
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
 *     responses:
 *       200:
 *         description: List of areas retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaginatedAreas'
 *   post:
 *     summary: Create a new area (Admin only)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAreaInput'
 *     responses:
 *       201:
 *         description: Area created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AreaResponse'
 *       400:
 *         description: Validation error or invalid City ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router
  .route('/')
  .get(validate(areaValidation.areaQuerySchema), areaController.getAreas)
  .post(
    auth,
    authorize('admin'),
    validate(areaValidation.createAreaSchema),
    areaController.createArea,
  );

/**
 * @swagger
 * /areas/{id}:
 *   get:
 *     summary: Get area by ID with populated city details
 *     tags: [Areas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Area ID
 *     responses:
 *       200:
 *         description: Area details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AreaResponse'
 *       404:
 *         description: Area not found
 *   put:
 *     summary: Update area by ID (Admin only)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Area ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAreaInput'
 *     responses:
 *       200:
 *         description: Area updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AreaResponse'
 *       400:
 *         description: Validation error or invalid City ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Area not found
 *   delete:
 *     summary: Soft delete area by ID (Admin only)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Area ID
 *     responses:
 *       200:
 *         description: Area deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Area not found
 */
router
  .route('/:id')
  .get(validate(areaValidation.getAreaByIdSchema), areaController.getAreaById)
  .put(
    auth,
    authorize('admin'),
    validate(areaValidation.updateAreaSchema),
    areaController.updateArea,
  )
  .delete(
    auth,
    authorize('admin'),
    validate(areaValidation.getAreaByIdSchema),
    areaController.deleteArea,
  );

/**
 * @swagger
 * /areas/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted area (Admin only)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Area ID
 *     responses:
 *       200:
 *         description: Area restored successfully
 *       400:
 *         description: Area is not deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Area not found
 */
router.patch(
  '/:id/restore',
  auth,
  authorize('admin'),
  validate(areaValidation.getAreaByIdSchema),
  areaController.restoreArea,
);

export default router;
