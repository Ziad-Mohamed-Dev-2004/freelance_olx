import app from './app';
import { config } from './config/env.config';
import logger from './utils/logger';
import { connectDB } from './config/database';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeChatSocket } from './sockets/chat.socket';
import { seedEgyptLocations } from './scripts/seedLocations';
import City from './models/city.model';
import cloudinaryService from './services/cloudinary.service';

// ─── Vercel Serverless Compatibility ─────────────────────────────────────────
// On Vercel the platform manages HTTP connections itself — we must NOT call
// httpServer.listen(). We export `app` and let Vercel invoke it as a handler.
// Socket.io requires a persistent server, so it is only initialised when
// running outside Vercel (local dev, Railway, Render, etc.).
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  // On Vercel: connect to DB once per cold start, then let the platform route
  // requests to the exported `app`.
  connectDB().catch((err) => {
    logger.error('Failed to connect to MongoDB on Vercel cold start:', err);
  });
} else {
  // Local dev / traditional server: full boot with Socket.io and CSV auto-seed.
  void connectDB().then(async () => {
    try {
      const cityCount = await City.countDocuments();
      if (cityCount === 0) {
        logger.info(
          'No cities found in DB. Auto-seeding Egypt Governorates & Areas from CSV files...',
        );
        await seedEgyptLocations();
      }
    } catch (err) {
      logger.error('Error auto-seeding locations on startup:', err);
    }

    try {
      const imageStorageStatus = await cloudinaryService.verifyUploadAccess();
      if (imageStorageStatus.ok) {
        logger.info(`Image uploads ready (${imageStorageStatus.mode} storage).`);
      } else {
        logger.warn(`Image uploads are not fully configured: ${imageStorageStatus.message}`);
        if (config.env === 'development') {
          logger.warn(
            'Development fallback: uploads will use local storage when Cloudinary returns a permissions error.',
          );
        }
      }
    } catch (err) {
      logger.error('Failed to verify image upload configuration:', err);
    }

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: config.socket.corsOrigin === '*' ? true : config.socket.corsOrigin,
        credentials: config.socket.corsOrigin !== '*',
      },
    });
    initializeChatSocket(io);

    let server: ReturnType<typeof httpServer.listen> | undefined;
    server = httpServer.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });

    const exitHandler = () => {
      if (server) {
        server.close(() => {
          logger.info('Server closed');
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    };

    const unexpectedErrorHandler = (error: Error) => {
      logger.error(error);
      exitHandler();
    };

    process.on('uncaughtException', unexpectedErrorHandler);
    process.on('unhandledRejection', unexpectedErrorHandler);

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      if (server) {
        server.close();
      }
    });
  });
}

// ─── Export app for Vercel serverless handler ─────────────────────────────────
export default app;
