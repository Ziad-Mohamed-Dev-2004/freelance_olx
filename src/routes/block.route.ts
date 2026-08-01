import express from 'express';
import * as controller from '../controllers/block.controller';
import { auth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as validation from '../validators/block.validation';
const router = express.Router();
/** @swagger
 * /blocks: { get: { summary: Get blocked users, tags: [Blocks], security: [{ bearerAuth: [] }], responses: { 200: { description: Block list } } } }
 * /blocks/{userId}: { post: { summary: Block a user, tags: [Blocks], security: [{ bearerAuth: [] }], responses: { 201: { description: User blocked }, 409: { description: Already blocked } } }, delete: { summary: Unblock a user, tags: [Blocks], security: [{ bearerAuth: [] }], responses: { 200: { description: User unblocked } } } }
 * /blocks/check/{userId}: { get: { summary: Check whether a user is blocked, tags: [Blocks], security: [{ bearerAuth: [] }], responses: { 200: { description: Block status } } } }
 */
router.get('/', auth, validate(validation.blockQuerySchema), controller.getBlocks);
router.post('/:userId', auth, validate(validation.blockUserSchema), controller.blockUser);
router.delete('/:userId', auth, validate(validation.blockUserSchema), controller.unblockUser);
router.get('/check/:userId', auth, validate(validation.blockUserSchema), controller.checkBlock);
export default router;
