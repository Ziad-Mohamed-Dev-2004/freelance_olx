import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const optionalImageSchema = z
  .union([z.string().url('Image must be a valid URL'), z.literal('')])
  .optional();

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ message: 'Category name is required' })
      .min(2, 'Name must be at least 2 characters'),
    icon: z.string().optional(),
    image: optionalImageSchema,
    parentCategory: objectIdSchema.nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    icon: z.string().optional(),
    image: optionalImageSchema,
    parentCategory: objectIdSchema.nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getCategoryByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const categoryQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    parentCategory: z.string().optional(),
  }),
});
