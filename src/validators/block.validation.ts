import { z } from 'zod';
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
export const blockUserSchema = z.object({ params: z.object({ userId: objectId }) });
export const blockQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.enum(['newest', 'oldest']).optional(),
  }),
});
