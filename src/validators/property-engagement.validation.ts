import { z } from 'zod';
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const pagination = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sort: z.enum(['newest', 'oldest']).optional(),
});
export const propertyIdSchema = z.object({ params: z.object({ id: objectId }) });
export const reviewIdSchema = z.object({ params: z.object({ reviewId: objectId }) });
export const createReviewSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(3).max(1000).optional(),
  }),
});
export const updateReviewSchema = z.object({
  params: z.object({ reviewId: objectId }),
  body: z
    .object({
      rating: z.number().int().min(1).max(5).optional(),
      comment: z.string().trim().min(3).max(1000).optional(),
    })
    .refine((body) => Object.keys(body).length > 0),
});
export const reviewQuerySchema = z.object({
  params: z.object({ id: objectId }),
  query: pagination,
});
export const savedSearchSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    filters: z.record(z.string(), z.unknown()),
  }),
});
export const savedSearchIdSchema = z.object({ params: z.object({ id: objectId }) });
export const updateSavedSearchSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      filters: z.record(z.string(), z.unknown()).optional(),
    })
    .refine((body) => Object.keys(body).length > 0),
});
export const paginationSchema = z.object({ query: pagination });
export const sharePropertySchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    channel: z.enum(['copy_link', 'whatsapp', 'facebook', 'twitter', 'other']).optional(),
  }),
});
