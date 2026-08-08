import express from 'express';
import * as controller from '../controllers/conversation.controller';
import { auth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as validation from '../validators/chat.validation';
const router = express.Router();
/** @swagger
 * /conversations:
 *   get: { summary: List the authenticated user's conversations, tags: [Chat], security: [{ bearerAuth: [] }], parameters: [{ in: query, name: page, schema: { type: integer } }, { in: query, name: limit, schema: { type: integer } }], responses: { 200: { description: Paginated conversations } } }
 *   post: { summary: Start or return the unique conversation for a property and user pair, tags: [Chat], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { application/json: { schema: { type: object, required: [propertyId], properties: { propertyId: { type: string }, recipientId: { type: string, description: Defaults to the property owner } } } } } }, responses: { 201: { description: Conversation ready }, 403: { description: Users are blocked } } }
 * /conversations/{conversationId}:
 *   get: { summary: Get one conversation, tags: [Chat], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: conversationId, required: true, schema: { type: string } }], responses: { 200: { description: Conversation } } }
 *   delete: { summary: Delete a conversation and all its messages, tags: [Chat], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: conversationId, required: true, schema: { type: string } }], responses: { 200: { description: Conversation deleted successfully } } }
 */
router
  .route('/')
  .get(auth, validate(validation.conversationQuerySchema), controller.list)
  .post(auth, validate(validation.startConversationSchema), controller.start);
router.get('/:conversationId', auth, validate(validation.conversationIdSchema), controller.get);
router.delete('/:conversationId', auth, validate(validation.conversationIdSchema), controller.remove);
export default router;
