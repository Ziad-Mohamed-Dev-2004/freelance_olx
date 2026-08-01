import express from 'express';
import * as cityController from '../controllers/city.controller';
import { validate } from '../middlewares/validate.middleware';
import * as cityValidation from '../validators/city.validation';
import { auth, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /cities:
 *   get:
 *     summary: Retrieve a paginated list of cities
 *     tags: [Cities]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search city by name or governorate
 *       - in: query
 *         name: governorate
 *         schema:
 *           type: string
 *         description: Filter by governorate name
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
 *         description: List of cities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaginatedCities'
 *   post:
 *     summary: Create a new city (Admin only)
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCityInput'
 *     responses:
 *       201:
 *         description: City created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CityResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       409:
 *         description: City name already exists
 */
router
  .route('/')
  .get(validate(cityValidation.cityQuerySchema), cityController.getCities)
  .post(
    auth,
    authorize('admin'),
    validate(cityValidation.createCitySchema),
    cityController.createCity,
  );

/**
 * @swagger
 * /cities/{id}:
 *   get:
 *     summary: Get city by ID
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *     responses:
 *       200:
 *         description: City details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CityResponse'
 *       404:
 *         description: City not found
 *   put:
 *     summary: Update city by ID (Admin only)
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCityInput'
 *     responses:
 *       200:
 *         description: City updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CityResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: City not found
 *       409:
 *         description: City name already exists
 *   delete:
 *     summary: Soft delete city by ID (Admin only)
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *     responses:
 *       200:
 *         description: City deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: City not found
 */
router
  .route('/:id')
  .get(validate(cityValidation.getCityByIdSchema), cityController.getCityById)
  .put(
    auth,
    authorize('admin'),
    validate(cityValidation.updateCitySchema),
    cityController.updateCity,
  )
  .delete(
    auth,
    authorize('admin'),
    validate(cityValidation.getCityByIdSchema),
    cityController.deleteCity,
  );

/**
 * @swagger
 * /cities/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted city (Admin only)
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *     responses:
 *       200:
 *         description: City restored successfully
 *       400:
 *         description: City is not deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: City not found
 */
router.patch(
  '/:id/restore',
  auth,
  authorize('admin'),
  validate(cityValidation.getCityByIdSchema),
  cityController.restoreCity,
);

export default router;
