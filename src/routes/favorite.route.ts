import express from 'express';
import * as controller from '../controllers/favorite.controller';
import { auth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as validation from '../validators/favorite.validation';
const router = express.Router();
/** @swagger
 * /favorites: { get: { summary: Get authenticated user's paginated active-property favorites, tags: [Favorites], security: [{ bearerAuth: [] }], responses: { 200: { description: Favorites retrieved }, 401: { description: Unauthorized } } } }
 * /favorites/{propertyId}: { post: { summary: Add an active property to favorites, tags: [Favorites], security: [{ bearerAuth: [] }], responses: { 201: { description: Favorite created }, 409: { description: Already favorited } } }, delete: { summary: Remove a favorite, tags: [Favorites], security: [{ bearerAuth: [] }], responses: { 200: { description: Favorite removed }, 404: { description: Favorite not found } } } }
 * /favorites/check/{propertyId}: { get: { summary: Check favorite status and property favorite count, tags: [Favorites], security: [{ bearerAuth: [] }], responses: { 200: { description: Favorite status } } } }
 */
router.get('/', auth, validate(validation.favoriteQuerySchema), controller.getFavorites);
router.post(
  '/:propertyId',
  auth,
  validate(validation.favoritePropertySchema),
  controller.addFavorite,
);
router.delete(
  '/:propertyId',
  auth,
  validate(validation.favoritePropertySchema),
  controller.removeFavorite,
);
router.get(
  '/check/:propertyId',
  auth,
  validate(validation.favoritePropertySchema),
  controller.checkFavorite,
);
export default router;
