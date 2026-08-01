import { z } from 'zod';
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
export const favoritePropertySchema = z.object({ params: z.object({ propertyId: objectId }) });
export const favoriteQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.enum(['newest', 'oldest']).optional(),
  }),
});
