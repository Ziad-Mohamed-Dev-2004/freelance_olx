import { z } from 'zod';
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const pagination = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
const attachment = z.object({
  url: z.string().url(),
  publicId: z.string().optional(),
  name: z.string().max(255).optional(),
  mimeType: z.string().max(150).optional(),
  size: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
});
export const startConversationSchema = z.object({
  body: z.object({ propertyId: objectId, recipientId: objectId.optional() }),
});
export const conversationIdSchema = z.object({ params: z.object({ conversationId: objectId }) });
export const conversationQuerySchema = z.object({ query: pagination });
export const sendMessageSchema = z.object({
  params: z.object({ conversationId: objectId }),
  body: z
    .object({
      type: z.enum(['text', 'image', 'file', 'voice']).default('text'),
      text: z.string().trim().max(4000).optional(),
      attachment: attachment.optional(),
    })
    .superRefine((value, ctx) => {
      if (value.type === 'text' && !value.text)
        ctx.addIssue({
          code: 'custom',
          path: ['text'],
          message: 'Text is required for text messages',
        });
      if (value.type !== 'text' && !value.attachment)
        ctx.addIssue({
          code: 'custom',
          path: ['attachment'],
          message: 'Attachment is required for media messages',
        });
    }),
});
