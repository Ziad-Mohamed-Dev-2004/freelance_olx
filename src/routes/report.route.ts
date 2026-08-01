import express from 'express';
import * as controller from '../controllers/report.controller';
import { auth, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as validation from '../validators/report.validation';
const router = express.Router();
/** @swagger
 * /reports/property/{propertyId}: { post: { summary: Report a property, tags: [Reports], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { application/json: { schema: { type: object, required: [reason], properties: { reason: { type: string, example: Spam }, description: { type: string, example: Suspicious duplicate listing } } } } } }, responses: { 201: { description: Report created }, 409: { description: Duplicate pending report } } } }
 * /reports/user/{userId}: { post: { summary: Report a user, tags: [Reports], security: [{ bearerAuth: [] }], responses: { 201: { description: Report created } } } }
 * /reports/me: { get: { summary: Get own reports, tags: [Reports], security: [{ bearerAuth: [] }], responses: { 200: { description: Reports retrieved } } } }
 * /reports: { get: { summary: List reports (admin), tags: [Reports], security: [{ bearerAuth: [] }], responses: { 200: { description: Reports retrieved }, 403: { description: Admin only } } } }
 * /reports/{id}: { get: { summary: Get report (admin), tags: [Reports], security: [{ bearerAuth: [] }], responses: { 200: { description: Report retrieved } } }, delete: { summary: Delete report (admin), tags: [Reports], security: [{ bearerAuth: [] }], responses: { 200: { description: Report deleted } } } }
 * /reports/{id}/status: { patch: { summary: Update report status (admin), tags: [Reports], security: [{ bearerAuth: [] }], responses: { 200: { description: Status updated } } } }
 * /reports/{id}/resolve: { patch: { summary: Resolve report (admin), tags: [Reports], security: [{ bearerAuth: [] }], responses: { 200: { description: Report resolved } } } }
 */
router.post(
  '/property/:propertyId',
  auth,
  validate(validation.reportPropertySchema),
  controller.reportProperty,
);
router.post('/user/:userId', auth, validate(validation.reportUserSchema), controller.reportUser);
router.get('/me', auth, validate(validation.reportQuerySchema), controller.getMyReports);
router.get(
  '/',
  auth,
  authorize('admin'),
  validate(validation.reportQuerySchema),
  controller.getReports,
);
router.get(
  '/:id',
  auth,
  authorize('admin'),
  validate(validation.reportIdSchema),
  controller.getReport,
);
router.patch(
  '/:id/status',
  auth,
  authorize('admin'),
  validate(validation.updateReportStatusSchema),
  controller.updateStatus,
);
router.patch(
  '/:id/resolve',
  auth,
  authorize('admin'),
  validate(validation.resolveReportSchema),
  controller.resolveReport,
);
router.delete(
  '/:id',
  auth,
  authorize('admin'),
  validate(validation.reportIdSchema),
  controller.deleteReport,
);
export default router;
