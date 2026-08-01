import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { mongoSanitizeMiddleware } from './middlewares/sanitize.middleware';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { swaggerSpec } from './docs/swagger';
import logger from './utils/logger';
import authRoutes from './routes/auth.route';
import categoryRoutes from './routes/category.route';
import cityRoutes from './routes/city.route';
import areaRoutes from './routes/area.route';
import propertyRoutes from './routes/property.route';
import favoriteRoutes from './routes/favorite.route';
import reportRoutes from './routes/report.route';
import blockRoutes from './routes/block.route';
import conversationRoutes from './routes/conversation.route';
import messageRoutes from './routes/message.route';
import notificationRoutes from './routes/notification.route';
import adminRoutes from './routes/admin.route';
import propertyEngagementRoutes from './routes/property-engagement.route';

const app: Express = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── NoSQL Injection Sanitization ─────────────────────────────────────────────
// Custom middleware: compatible with Express 5 (skips read-only req.query)
app.use(mongoSanitizeMiddleware);

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors());
app.options(/.*/, cors());

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
app.use(
  morgan('tiny', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }),
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
});
app.use('/api/v1/auth', authLimiter);

// ─── API Documentation (Swagger) ──────────────────────────────────────────────
app.get('/api/v1/docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'OLX Clone API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'list',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      persistAuthorization: true,
    },
  }),
);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cities', cityRoutes);
app.use('/api/v1/areas', areaRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/blocks', blockRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/conversations', messageRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', propertyEngagementRoutes);

// ─── Root Route ───────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'OLX Clone API is live 🚀',
    version: 'v1',
    docs: '/api/v1/docs',
    health: '/api/v1/health',
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     description: Returns the current status of the API. No authentication required.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HealthResponse'
 */
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'API is running', data: { status: 'OK' } });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
