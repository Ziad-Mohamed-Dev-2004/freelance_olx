import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const createAreaSchema = z.object({
  body: z.object({
    city: objectIdSchema,
    name: z
      .string({ message: 'Area name is required' })
      .min(2, 'Name must be at least 2 characters'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateAreaSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    city: objectIdSchema.optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getAreaByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const areaQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    city: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});
