import express from 'express';
import * as controller from '../controllers/property-engagement.controller';
import { auth, optionalAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as validation from '../validators/property-engagement.validation';

const router = express.Router();
/**
 * @swagger
 * /properties/{id}/reviews:
 *   get:
 *     summary: List property reviews and rating summary
 *     tags: [Reviews & Ratings]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string }, example: '64a1b2c3d4e5f67890abcdef' }, { in: query, name: page, schema: { type: integer, example: 1 } }, { in: query, name: limit, schema: { type: integer, example: 10 } }]
 *     responses: { 200: { description: Paginated reviews and rating summary }, 400: { description: Invalid ObjectId, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } }
 *   post:
 *     summary: Create one review for a property
 *     tags: [Reviews & Ratings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [rating], properties: { rating: { type: integer, minimum: 1, maximum: 5, example: 5 }, comment: { type: string, example: 'Clean property and responsive owner.' } } } } } }
 *     responses: { 201: { description: Review created }, 409: { description: Already reviewed } }
 * /reviews/{reviewId}:
 *   patch:
 *     summary: Update own review
 *     tags: [Reviews & Ratings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { content: { application/json: { schema: { type: object, properties: { rating: { type: integer, example: 4 }, comment: { type: string, example: 'Updated review text.' } } } } } }
 *     responses: { 200: { description: Review updated }, 403: { description: Not review owner } }
 *   delete: { summary: Delete own review, tags: [Reviews & Ratings], security: [{ bearerAuth: [] }], responses: { 200: { description: Review deleted } } }
 * /saved-searches:
 *   get: { summary: List own saved searches, tags: [Saved Searches], security: [{ bearerAuth: [] }], responses: { 200: { description: Saved searches retrieved } } }
 *   post:
 *     summary: Save a property filter set
 *     tags: [Saved Searches]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [name, filters], properties: { name: { type: string, example: 'Furnished Maadi apartments' }, filters: { type: object, example: { furnished: true, maxPrice: 25000 } } } } } } }
 *     responses: { 201: { description: Saved search created } }
 * /saved-searches/{id}:
 *   patch: { summary: Update own saved search, tags: [Saved Searches], security: [{ bearerAuth: [] }], requestBody: { content: { application/json: { schema: { type: object, properties: { name: { type: string }, filters: { type: object } } } } } }, responses: { 200: { description: Saved search updated } } }
 *   delete: { summary: Delete own saved search, tags: [Saved Searches], security: [{ bearerAuth: [] }], responses: { 200: { description: Saved search deleted } } }
 * /recently-viewed:
 *   get: { summary: List recently viewed properties, tags: [Properties], security: [{ bearerAuth: [] }], responses: { 200: { description: Recently viewed properties retrieved } } }
 * /properties/{id}/share:
 *   post: { summary: Create a property sharing link, tags: [Properties], requestBody: { content: { application/json: { schema: { type: object, properties: { channel: { type: string, enum: [copy_link, whatsapp, facebook, twitter, other], example: whatsapp } } } } } }, responses: { 200: { description: Share URL created } } }
 * /properties/{id}/contact-owner:
 *   post: { summary: Start or return a conversation with the owner, tags: [Contact Owner], security: [{ bearerAuth: [] }], responses: { 201: { description: Conversation ready }, 403: { description: Contact blocked } } }
 */
router.get(
  '/properties/:id/reviews',
  validate(validation.reviewQuerySchema),
  controller.listReviews,
);
router.post(
  '/properties/:id/reviews',
  auth,
  validate(validation.createReviewSchema),
  controller.createReview,
);
router.patch(
  '/reviews/:reviewId',
  auth,
  validate(validation.updateReviewSchema),
  controller.updateReview,
);
router.delete(
  '/reviews/:reviewId',
  auth,
  validate(validation.reviewIdSchema),
  controller.deleteReview,
);
router.post(
  '/properties/:id/share',
  optionalAuth,
  validate(validation.sharePropertySchema),
  controller.shareProperty,
);
router.post(
  '/properties/:id/contact-owner',
  auth,
  validate(validation.propertyIdSchema),
  controller.contactOwner,
);
router
  .route('/saved-searches')
  .get(auth, controller.getSavedSearches)
  .post(auth, validate(validation.savedSearchSchema), controller.createSavedSearch);
router.patch(
  '/saved-searches/:id',
  auth,
  validate(validation.updateSavedSearchSchema),
  controller.updateSavedSearch,
);
router.delete(
  '/saved-searches/:id',
  auth,
  validate(validation.savedSearchIdSchema),
  controller.deleteSavedSearch,
);
router.get(
  '/recently-viewed',
  auth,
  validate(validation.paginationSchema),
  controller.getRecentlyViewed,
);
export default router;
