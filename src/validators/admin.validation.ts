import { z } from 'zod';
import { UserRole, UserStatus } from '../interfaces/user.interface';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const dashboardStatsSchema = z.object({ query: z.object({}).optional() });

export const recentActivityQuerySchema = z.object({
  query: z.object({ limit: z.string().regex(/^\d+$/).optional() }),
});

export const adminLogQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.enum(['newest', 'oldest']).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    action: z.string().trim().min(1).max(100).optional(),
  }),
});

export const analyticsQuerySchema = z.object({
  query: z
    .object({
      period: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).default('daily'),
      startDate: dateString.optional(),
      endDate: dateString.optional(),
    })
    .superRefine((data, ctx) => {
      if (data.period === 'custom') {
        if (!data.startDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'startDate is required for custom period',
            path: ['startDate'],
          });
        }
        if (!data.endDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'endDate is required for custom period',
            path: ['endDate'],
          });
        }
        if (data.startDate && data.endDate && data.startDate > data.endDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'startDate must be before or equal to endDate',
            path: ['startDate'],
          });
        }
      }
    }),
});

export const adminUserQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.enum(['newest', 'oldest']).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    verified: z.enum(['true', 'false']).optional(),
    createdFrom: dateString.optional(),
    createdTo: dateString.optional(),
  }),
});

export const adminUserIdSchema = z.object({ params: z.object({ id: objectId }) });

export const updateAdminUserSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      email: z.string().trim().email().optional(),
      phone: z.string().trim().min(6).max(20).optional(),
      avatar: z.string().url().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' }),
});

export const changeUserRoleSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ role: z.nativeEnum(UserRole) }),
});

export const resetUserPasswordSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});
