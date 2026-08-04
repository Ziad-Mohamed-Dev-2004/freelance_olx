import express from 'express';
import * as controller from '../controllers/admin.controller';
import * as propertyController from '../controllers/property.controller';
import * as reportController from '../controllers/report.controller';
import * as categoryController from '../controllers/category.controller';
import * as cityController from '../controllers/city.controller';
import * as areaController from '../controllers/area.controller';
import { auth, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as validation from '../validators/admin.validation';
import * as propertyValidation from '../validators/property.validation';
import * as reportValidation from '../validators/report.validation';
import * as categoryValidation from '../validators/category.validation';
import * as cityValidation from '../validators/city.validation';
import * as areaValidation from '../validators/area.validation';
import { uploadSingleImage } from '../middlewares/upload.middleware';
import { normalizeCategoryFormData } from '../middlewares/parseFormData.middleware';
import { auditAdminAction } from '../middlewares/admin-audit.middleware';

const router = express.Router();
const admin = [auth, authorize('admin')] as const;

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Returns aggregate counts for users, properties, reports, chat, and today's activity. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DashboardStats'
 *       403:
 *         description: Admin only
 */
/**
 * @swagger
 * /admin/dashboard/recent-activity:
 *   get:
 *     summary: Get the latest dashboard activity
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, example: 10 }
 *     responses:
 *       200: { description: Recent users, properties, reports, messages, and favorites, content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       403: { description: Admin role required, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 * /admin/logs:
 *   get:
 *     summary: List audit logs with pagination and filters
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: APPROVE_PROPERTY }
 *     responses:
 *       200: { description: Paginated audit logs, content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 */
router.get(
  '/dashboard/recent-activity',
  ...admin,
  validate(validation.recentActivityQuerySchema),
  controller.getRecentActivity,
);
router.get('/logs', ...admin, validate(validation.adminLogQuerySchema), controller.getAdminLogs);

router.get(
  '/dashboard',
  ...admin,
  validate(validation.dashboardStatsSchema),
  controller.getDashboardStats,
);

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     summary: Get analytics chart data
 *     description: Returns time-series chart data for users, properties, views, messages, reports, and favorites. Supports daily, weekly, monthly, yearly, and custom date ranges.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, custom]
 *           default: daily
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: '2026-01-01'
 *         description: Required when period is custom
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: '2026-07-30'
 *         description: Required when period is custom
 *     responses:
 *       200:
 *         description: Analytics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AnalyticsResult'
 *       400:
 *         description: Invalid date range
 *       403:
 *         description: Admin only
 */
router.get(
  '/analytics',
  ...admin,
  validate(validation.analyticsQuerySchema),
  controller.getAnalytics,
);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, oldest] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, admin] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, blocked, suspended] }
 *       - in: query
 *         name: verified
 *         schema: { type: string, enum: ['true', 'false'] }
 *         description: Filter by email verification status
 *       - in: query
 *         name: createdFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: createdTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Users retrieved
 *       403:
 *         description: Admin only
 */
router.get('/users', ...admin, validate(validation.adminUserQuerySchema), controller.getUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user details (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User retrieved with activity stats
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update user (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               avatar: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Soft delete any account except the current admin account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User soft deleted
 */
router.get('/users/:id', ...admin, validate(validation.adminUserIdSchema), controller.getUser);
router.get('/cities', ...admin, validate(cityValidation.cityQuerySchema), cityController.getCities);
router.post(
  '/cities',
  ...admin,
  validate(cityValidation.createCitySchema),
  cityController.createCity,
);
router.get(
  '/cities/:id',
  ...admin,
  validate(cityValidation.getCityByIdSchema),
  cityController.getCityById,
);
router.patch(
  '/cities/:id',
  ...admin,
  validate(cityValidation.updateCitySchema),
  cityController.updateCity,
);
router.delete(
  '/cities/:id',
  ...admin,
  validate(cityValidation.getCityByIdSchema),
  cityController.deleteCity,
);
router.patch(
  '/cities/:id/restore',
  ...admin,
  validate(cityValidation.getCityByIdSchema),
  cityController.restoreCity,
);
router.patch(
  '/cities/:id/activate',
  ...admin,
  validate(cityValidation.getCityByIdSchema),
  cityController.activateCity,
);
router.patch(
  '/cities/:id/deactivate',
  ...admin,
  validate(cityValidation.getCityByIdSchema),
  cityController.deactivateCity,
);

router.get('/areas', ...admin, validate(areaValidation.areaQuerySchema), areaController.getAreas);
router.post(
  '/areas',
  ...admin,
  validate(areaValidation.createAreaSchema),
  areaController.createArea,
);
router.get(
  '/areas/:id',
  ...admin,
  validate(areaValidation.getAreaByIdSchema),
  areaController.getAreaById,
);
router.patch(
  '/areas/:id',
  ...admin,
  validate(areaValidation.updateAreaSchema),
  areaController.updateArea,
);
router.delete(
  '/areas/:id',
  ...admin,
  validate(areaValidation.getAreaByIdSchema),
  areaController.deleteArea,
);
router.patch(
  '/areas/:id/restore',
  ...admin,
  validate(areaValidation.getAreaByIdSchema),
  areaController.restoreArea,
);
router.patch(
  '/areas/:id/activate',
  ...admin,
  validate(areaValidation.getAreaByIdSchema),
  areaController.activateArea,
);
router.patch(
  '/areas/:id/deactivate',
  ...admin,
  validate(areaValidation.getAreaByIdSchema),
  areaController.deactivateArea,
);

router.patch(
  '/users/:id',
  ...admin,
  validate(validation.updateAdminUserSchema),
  controller.updateUser,
);
router.delete(
  '/users/:id',
  ...admin,
  validate(validation.adminUserIdSchema),
  auditAdminAction('DELETE_USER', 'User'),
  controller.deleteUser,
);

/**
 * @swagger
 * /admin/users/{id}/block:
 *   patch:
 *     summary: Block user (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User blocked
 */
router.patch(
  '/users/:id/block',
  ...admin,
  validate(validation.adminUserIdSchema),
  auditAdminAction('BLOCK_USER', 'User'),
  controller.blockUser,
);

/**
 * @swagger
 * /admin/users/{id}/unblock:
 *   patch:
 *     summary: Unblock user (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User unblocked
 */
router.patch(
  '/users/:id/unblock',
  ...admin,
  validate(validation.adminUserIdSchema),
  auditAdminAction('UNBLOCK_USER', 'User'),
  controller.unblockUser,
);

/**
 * @swagger
 * /admin/users/{id}/suspend:
 *   patch:
 *     summary: Suspend user (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User suspended
 */
router.patch(
  '/users/:id/suspend',
  ...admin,
  validate(validation.adminUserIdSchema),
  controller.suspendUser,
);

/**
 * @swagger
 * /admin/users/{id}/activate:
 *   patch:
 *     summary: Activate user (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User activated
 */
router.patch(
  '/users/:id/activate',
  ...admin,
  validate(validation.adminUserIdSchema),
  controller.activateUser,
);

/**
 * @swagger
 * /admin/users/{id}/restore:
 *   patch:
 *     summary: Restore soft-deleted user (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User restored
 */
router.patch(
  '/users/:id/restore',
  ...admin,
  validate(validation.adminUserIdSchema),
  controller.restoreUser,
);

/**
 * @swagger
 * /admin/users/{id}/reset-password:
 *   patch:
 *     summary: Reset user password (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, format: password, example: 'NewPassword123' }
 *     responses:
 *       200:
 *         description: Password reset
 */
router.patch(
  '/users/:id/reset-password',
  ...admin,
  validate(validation.resetUserPasswordSchema),
  auditAdminAction('RESET_USER_PASSWORD', 'User'),
  controller.resetUserPassword,
);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Change user role (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch(
  '/users/:id/change-role',
  ...admin,
  validate(validation.changeUserRoleSchema),
  auditAdminAction('CHANGE_USER_ROLE', 'User'),
  controller.changeUserRole,
);

// Property management
router.get(
  '/properties',
  ...admin,
  validate(propertyValidation.propertyQuerySchema),
  propertyController.getProperties,
);
router.get(
  '/properties/:id',
  ...admin,
  validate(propertyValidation.propertyIdSchema),
  propertyController.getPropertyById,
);
router.patch(
  '/properties/:id/approve',
  ...admin,
  validate(propertyValidation.propertyIdSchema),
  auditAdminAction('APPROVE_PROPERTY', 'Property'),
  propertyController.approveProperty,
);
router.patch(
  '/properties/:id/reject',
  ...admin,
  validate(propertyValidation.propertyIdSchema),
  auditAdminAction('REJECT_PROPERTY', 'Property'),
  propertyController.rejectProperty,
);
router.patch(
  '/properties/:id/archive',
  ...admin,
  validate(propertyValidation.propertyIdSchema),
  propertyController.archiveProperty,
);
router.patch(
  '/properties/:id/rented',
  ...admin,
  validate(propertyValidation.propertyIdSchema),
  propertyController.rentProperty,
);
router.patch(
  '/properties/:id/feature',
  ...admin,
  validate(propertyValidation.propertyIdSchema),
  propertyController.featureProperty,
);
router.patch(
  '/properties/:id/unfeature',
  ...admin,
  validate(propertyValidation.propertyIdSchema),
  propertyController.unfeatureProperty,
);
router.delete(
  '/properties/:id',
  ...admin,
  validate(propertyValidation.propertyIdSchema),
  auditAdminAction('DELETE_PROPERTY', 'Property'),
  propertyController.deleteProperty,
);
router.patch(
  '/properties/:id/restore',
  ...admin,
  validate(propertyValidation.propertyIdSchema),
  propertyController.restoreProperty,
);

// Reports management
router.get(
  '/reports',
  ...admin,
  validate(reportValidation.reportQuerySchema),
  reportController.getReports,
);
router.get(
  '/reports/:id',
  ...admin,
  validate(reportValidation.reportIdSchema),
  reportController.getReport,
);
router.patch(
  '/reports/:id/resolve',
  ...admin,
  validate(reportValidation.resolveReportSchema),
  reportController.resolveReport,
);
router.patch(
  '/reports/:id/reject',
  ...admin,
  validate(reportValidation.resolveReportSchema),
  reportController.rejectReport,
);
router.patch(
  '/reports/:id/note',
  ...admin,
  validate(reportValidation.addReportNoteSchema),
  reportController.addAdminNote,
);
router.delete(
  '/reports/:id',
  ...admin,
  validate(reportValidation.reportIdSchema),
  reportController.deleteReport,
);

// Category management
router.get(
  '/categories',
  ...admin,
  validate(categoryValidation.categoryQuerySchema),
  categoryController.getCategories,
);
router.post(
  '/categories',
  ...admin,
  uploadSingleImage('image'),
  normalizeCategoryFormData,
  validate(categoryValidation.createCategorySchema),
  categoryController.createCategory,
);
router.get(
  '/categories/:id',
  ...admin,
  validate(categoryValidation.getCategoryByIdSchema),
  categoryController.getCategoryById,
);
router.patch(
  '/categories/:id',
  ...admin,
  uploadSingleImage('image'),
  normalizeCategoryFormData,
  validate(categoryValidation.updateCategorySchema),
  categoryController.updateCategory,
);
router.delete(
  '/categories/:id',
  ...admin,
  validate(categoryValidation.getCategoryByIdSchema),
  categoryController.deleteCategory,
);
router.patch(
  '/categories/:id/restore',
  ...admin,
  validate(categoryValidation.getCategoryByIdSchema),
  categoryController.restoreCategory,
);
router.patch(
  '/categories/:id/activate',
  ...admin,
  validate(categoryValidation.getCategoryByIdSchema),
  categoryController.activateCategory,
);
router.patch(
  '/categories/:id/deactivate',
  ...admin,
  validate(categoryValidation.getCategoryByIdSchema),
  categoryController.deactivateCategory,
);

export default router;
