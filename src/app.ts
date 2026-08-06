import express, { Express, Request, Response } from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { mongoSanitizeMiddleware } from './middlewares/sanitize.middleware';
import { connectDB } from './config/database';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { getSwaggerSpec } from './docs/swagger';
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

// Trust a bounded number of proxy hops so rate limiting cannot be bypassed
// by arbitrary X-Forwarded-For headers. Vercel sits behind a single proxy hop.
const parsedTrustProxyHops = Number(process.env.TRUST_PROXY_HOPS);
const trustProxyHops = Number.isInteger(parsedTrustProxyHops)
  ? parsedTrustProxyHops
  : process.env.VERCEL
    ? 1
    : 0;
app.set('trust proxy', trustProxyHops);

function getRequestOrigin(req: Request): string {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim();

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return `${req.protocol}://${req.get('host')}`;
}

// ─── Security Headers ─────────────────────────────────────────────────────────
// CSP is configured to allow unpkg CDN assets required by Swagger UI docs page.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https://unpkg.com", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://unpkg.com"],
        objectSrc: ["'none'"],
      },
    },
  }),
);

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

// ─── Local Uploaded Images ────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

// Ensure MongoDB is connected before handling API routes on serverless platforms.
app.use('/api/v1', async (req, res, next) => {
  if (req.path === '/docs' || req.path === '/docs.json') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// ─── API Documentation (Swagger) ──────────────────────────────────────────────
// Serve the raw OpenAPI JSON spec.
app.get('/api/v1/docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(getSwaggerSpec(getRequestOrigin(req)));
});

// Serve Swagger UI via CDN instead of local static files.
// swagger-ui-express's static file middleware doesn't work on Vercel serverless
// because all requests are routed to the serverless function and Express cannot
// serve binary assets with the correct MIME types in that environment.
app.get('/api/v1/docs', (_req: Request, res: Response) => {
  const docsJsonUrl = `${getRequestOrigin(_req)}/api/v1/docs.json`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>OLX Clone API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: ${JSON.stringify(docsJsonUrl)},
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
        docExpansion: 'list',
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        persistAuthorization: true,
        tryItOutEnabled: true,
      });
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

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
