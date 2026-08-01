import express from 'express';
import * as controller from '../controllers/property.controller';
import * as validation from '../validators/property.validation';
import { auth, authorize, optionalAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadPropertyImages } from '../middlewares/upload.middleware';
import { normalizePropertyFormData } from '../middlewares/parseFormData.middleware';

const router = express.Router();

/** @swagger
 * /properties:
 *   get:
 *     summary: List active properties with filters, sorting, and pagination
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         example: furnished apartment Maadi
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category ObjectId (same format applies to city and area)
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: area
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *         example: 10000
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *         example: 25000
 *       - in: query
 *         name: bedrooms
 *         schema: { type: integer }
 *       - in: query
 *         name: bathrooms
 *         schema: { type: integer }
 *       - in: query
 *         name: rentType
 *         schema: { type: string, enum: [Daily, Monthly, Yearly] }
 *       - in: query
 *         name: furnished
 *         schema: { type: boolean }
 *       - in: query
 *         name: parking
 *         schema: { type: boolean }
 *       - in: query
 *         name: elevator
 *         schema: { type: boolean }
 *       - in: query
 *         name: balcony
 *         schema: { type: boolean }
 *       - in: query
 *         name: airConditioner
 *         schema: { type: boolean }
 *       - in: query
 *         name: internet
 *         schema: { type: boolean }
 *       - in: query
 *         name: featured
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, oldest, lowestPrice, highestPrice, mostViewed, mostRecent] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *   post:
 *     summary: Create a property (multipart images[]; maximum 10)
 *     tags: [Properties]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/CreatePropertyInput' }
 *     responses:
 *       201: { description: Pending property created, content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 */
/** @swagger
 * /properties/{id}:
 *   get:
 *     summary: Get a property and record a deduplicated view
 *     tags: [Properties]
 *     responses:
 *       200: { description: Property retrieved, content: { application/json: { schema: { $ref: '#/components/schemas/PropertyResponse' } } } }
 *   put:
 *     summary: Update an owned property; image upload replaces the image collection
 *     tags: [Properties]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/UpdatePropertyInput' }
 *     responses:
 *       200: { description: Property updated }
 *   delete:
 *     summary: Soft-delete an owned property
 *     tags: [Properties]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Property deleted }
 */
router
  .route('/')
  .get(optionalAuth, validate(validation.propertyQuerySchema), controller.getProperties)
  .post(
    auth,
    uploadPropertyImages(),
    normalizePropertyFormData,
    validate(validation.createPropertySchema),
    controller.createProperty,
  );
/** @swagger
 * /properties/me:
 *   get:
 *     summary: Retrieve the authenticated user's properties
 *     tags: [Properties]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated properties, content: { application/json: { schema: { $ref: '#/components/schemas/PaginatedProperties' } } } }
 */
router.get('/me', auth, validate(validation.propertyQuerySchema), controller.getMyProperties);
// Deprecated alias retained for existing clients.
router.get('/mine', auth, validate(validation.propertyQuerySchema), controller.getMyProperties);
/** @swagger
 * /properties/{id}/images:
 *   post:
 *     summary: Append up to 10 total images to an owned property
 *     tags: [Properties]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, properties: { images: { type: array, items: { type: string, format: binary } } } }
 *     responses:
 *       200: { description: Images added, content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 * /properties/{id}/images/{imageId}:
 *   delete:
 *     summary: Delete one property image by its zero-based image index
 *     tags: [Properties]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Image deleted, content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 */
router.post(
  '/:id/images',
  auth,
  uploadPropertyImages(),
  validate(validation.propertyIdSchema),
  controller.addPropertyImages,
);
router.delete(
  '/:id/images/:imageId',
  auth,
  validate(validation.propertyImageIdSchema),
  controller.deletePropertyImage,
);
/** @swagger
 * /properties/{id}/restore:
 *   patch: { summary: Restore a deleted property (admin), tags: [Properties], security: [{ bearerAuth: [] }], responses: { 200: { description: Property restored } } }
 * /properties/{id}/approve:
 *   patch: { summary: Approve a pending property (admin), tags: [Properties], security: [{ bearerAuth: [] }], responses: { 200: { description: Property approved } } }
 * /properties/{id}/reject:
 *   patch: { summary: Reject a pending property (admin), tags: [Properties], security: [{ bearerAuth: [] }], responses: { 200: { description: Property rejected } } }
 * /properties/{id}/rented:
 *   patch: { summary: Mark an owned active property as rented, tags: [Properties], security: [{ bearerAuth: [] }], responses: { 200: { description: Property rented } } }
 * /properties/{id}/archive:
 *   patch: { summary: Archive an owned property, tags: [Properties], security: [{ bearerAuth: [] }], responses: { 200: { description: Property archived } } }
 */
router.patch(
  '/:id/restore',
  auth,
  authorize('admin'),
  validate(validation.propertyIdSchema),
  controller.restoreProperty,
);
router.patch(
  '/:id/approve',
  auth,
  authorize('admin'),
  validate(validation.propertyIdSchema),
  controller.approveProperty,
);
router.patch(
  '/:id/reject',
  auth,
  authorize('admin'),
  validate(validation.propertyIdSchema),
  controller.rejectProperty,
);
router.patch('/:id/rented', auth, validate(validation.propertyIdSchema), controller.rentProperty);
router.patch(
  '/:id/archive',
  auth,
  validate(validation.propertyIdSchema),
  controller.archiveProperty,
);
router
  .route('/:id')
  .get(optionalAuth, validate(validation.propertyIdSchema), controller.getPropertyById)
  .put(
    auth,
    uploadPropertyImages(),
    normalizePropertyFormData,
    validate(validation.updatePropertySchema),
    controller.updateProperty,
  )
  .delete(auth, validate(validation.propertyIdSchema), controller.deleteProperty);
export default router;
