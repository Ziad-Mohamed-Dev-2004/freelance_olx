import express from 'express';
import * as controller from '../controllers/message.controller';
import { auth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as validation from '../validators/chat.validation';
const router = express.Router();
/** @swagger
 * /conversations/{conversationId}/messages:
 *   get: { summary: Get reverse-chronological message history, tags: [Chat], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: conversationId, required: true, schema: { type: string } }, { in: query, name: page, schema: { type: integer } }, { in: query, name: limit, schema: { type: integer } }], responses: { 200: { description: Paginated messages } } }
 *   post: { summary: Send text, image, file, or voice message, tags: [Chat], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: conversationId, required: true, schema: { type: string } }], requestBody: { required: true, content: { application/json: { schema: { type: object, properties: { type: { type: string, enum: [text, image, file, voice] }, text: { type: string }, attachment: { type: object, properties: { url: { type: string, format: uri }, name: { type: string }, mimeType: { type: string }, size: { type: integer }, duration: { type: number } } } } } } } }, responses: { 201: { description: Message sent } } }
 * /conversations/{conversationId}/messages/delivered:
 *   patch: { summary: Mark received messages as delivered, tags: [Chat], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: conversationId, required: true, schema: { type: string } }], responses: { 200: { description: Updated } } }
 * /conversations/{conversationId}/messages/seen:
 *   patch: { summary: Mark received messages as seen, tags: [Chat], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: conversationId, required: true, schema: { type: string } }], responses: { 200: { description: Updated } } }
 * /conversations/{conversationId}/messages/bulk:
 *   delete: { summary: Delete selected messages you sent, tags: [Chat], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: conversationId, required: true, schema: { type: string } }], requestBody: { required: true, content: { application/json: { schema: { type: object, required: [messageIds], properties: { messageIds: { type: array, items: { type: string }, minItems: 1, maxItems: 100 } } } } } }, responses: { 200: { description: Selected messages deleted } } }
 * /conversations/{conversationId}/messages/all:
 *   delete: { summary: Delete all messages in the conversation, tags: [Chat], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: conversationId, required: true, schema: { type: string } }], responses: { 200: { description: Chat cleared } } }
 * /conversations/{conversationId}/messages/{messageId}:
 *   delete: { summary: Delete a message you sent, tags: [Chat], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: conversationId, required: true, schema: { type: string } }, { in: path, name: messageId, required: true, schema: { type: string } }], responses: { 200: { description: Message deleted } } }
 */
router.get(
  '/:conversationId/messages',
  auth,
  validate(validation.conversationIdSchema),
  validate(validation.conversationQuerySchema),
  controller.history,
);
router.post(
  '/:conversationId/messages',
  auth,
  validate(validation.sendMessageSchema),
  controller.send,
);
router.patch(
  '/:conversationId/messages/delivered',
  auth,
  validate(validation.conversationIdSchema),
  controller.delivered,
);
router.patch(
  '/:conversationId/messages/seen',
  auth,
  validate(validation.conversationIdSchema),
  controller.seen,
);
router.delete(
  '/:conversationId/messages/bulk',
  auth,
  validate(validation.bulkDeleteMessagesSchema),
  controller.removeMany,
);
router.delete(
  '/:conversationId/messages/all',
  auth,
  validate(validation.conversationIdSchema),
  controller.removeAll,
);
router.delete(
  '/:conversationId/messages/:messageId',
  auth,
  validate(validation.messageIdSchema),
  controller.remove,
);
export default router;
