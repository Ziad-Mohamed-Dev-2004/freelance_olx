import express from 'express';
import * as controller from '../controllers/notification.controller';
import { auth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as validation from '../validators/notification.validation';
const router = express.Router();
/** @swagger
 * /notifications:
 *   get: { summary: List authenticated user notifications, tags: [Notifications], security: [{ bearerAuth: [] }], responses: { 200: { description: Paginated notifications } } }
 * /notifications/read-all:
 *   patch: { summary: Mark all notifications as read, tags: [Notifications], security: [{ bearerAuth: [] }], responses: { 200: { description: Updated } } }
 * /notifications/{id}/read:
 *   patch: { summary: Mark one notification as read, tags: [Notifications], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { 200: { description: Updated } } }
 * /notifications/{id}:
 *   delete: { summary: Delete one notification, tags: [Notifications], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { 200: { description: Deleted } } }
 */
router.get('/', auth, validate(validation.notificationQuerySchema), controller.list);
router.patch('/read-all', auth, controller.markAllRead);
router.patch('/:id/read', auth, validate(validation.notificationIdSchema), controller.markRead);
router.delete('/:id', auth, validate(validation.notificationIdSchema), controller.remove);
export default router;
