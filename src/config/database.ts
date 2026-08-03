import mongoose from 'mongoose';
import logger from '../utils/logger';
import { config } from './env.config';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;
const isVercel = process.env.VERCEL === '1';

let connectionPromise: Promise<typeof mongoose> | null = null;
let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) {
    return;
  }

  listenersAttached = true;

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB runtime error: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Application might experience issues.');
  });
}

export const connectDB = async (retryCount = 0): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2 && connectionPromise) {
    await connectionPromise;
    return;
  }

  try {
    // Basic mongoose configuration for modern versions
    mongoose.set('strictQuery', false);
    attachConnectionListeners();

    connectionPromise =
      connectionPromise ??
      mongoose.connect(config.mongoose.url, {
        serverSelectionTimeoutMS: 10000,
      });

    await connectionPromise;
    logger.info('Successfully connected to MongoDB');
  } catch (error) {
    connectionPromise = null;
    logger.error(`MongoDB connection error: ${error instanceof Error ? error.message : error}`);

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      logger.info(
        `Retrying MongoDB connection in ${RETRY_INTERVAL_MS / 1000} seconds... (Attempt ${retryCount} of ${MAX_RETRIES})`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      return connectDB(retryCount);
    } else {
      logger.error('Failed to connect to MongoDB after maximum retries.');

      if (isVercel) {
        throw error;
      }

      process.exit(1);
    }
  } finally {
    if (mongoose.connection.readyState !== 2) {
      connectionPromise = null;
    }
  }
};
