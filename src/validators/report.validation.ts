import { z } from 'zod';
import { ReportReason, ReportStatus } from '../interfaces/report.interface';
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const body = z.object({
  reason: z.nativeEnum(ReportReason),
  description: z.string().trim().min(3).max(2000).optional(),
});
const query = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sort: z.enum(['newest', 'oldest']).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  status: z.nativeEnum(ReportStatus).optional(),
  reason: z.nativeEnum(ReportReason).optional(),
});
export const reportPropertySchema = z.object({ params: z.object({ propertyId: objectId }), body });
export const reportUserSchema = z.object({ params: z.object({ userId: objectId }), body });
export const reportIdSchema = z.object({ params: z.object({ id: objectId }) });
export const reportQuerySchema = z.object({ query });
export const updateReportStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.nativeEnum(ReportStatus),
    adminNote: z.string().trim().max(2000).optional(),
  }),
});
export const resolveReportSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ adminNote: z.string().trim().max(2000).optional() }),
});
export const addReportNoteSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ adminNote: z.string().trim().min(1).max(2000) }),
});
