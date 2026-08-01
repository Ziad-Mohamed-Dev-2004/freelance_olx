import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const createCitySchema = z.object({
  body: z.object({
    name: z
      .string({ message: 'City name is required' })
      .min(2, 'Name must be at least 2 characters'),
    governorate: z
      .string({ message: 'Governorate is required' })
      .min(2, 'Governorate must be at least 2 characters'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCitySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    governorate: z.string().min(2, 'Governorate must be at least 2 characters').optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getCityByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const cityQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    governorate: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});
