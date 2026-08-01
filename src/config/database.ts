import mongoose from 'mongoose';
import logger from '../utils/logger';
import { config } from './env.config';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

export const connectDB = async (retryCount = 0): Promise<void> => {
  try {
    // Basic mongoose configuration for modern versions
    mongoose.set('strictQuery', false);

    await mongoose.connect(config.mongoose.url);
    logger.info('Successfully connected to MongoDB');

    // Handle runtime connection errors
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB runtime error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Application might experience issues.');
    });
  } catch (error) {
    logger.error(`MongoDB connection error: ${error instanceof Error ? error.message : error}`);

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      logger.info(
        `Retrying MongoDB connection in ${RETRY_INTERVAL_MS / 1000} seconds... (Attempt ${retryCount} of ${MAX_RETRIES})`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      return connectDB(retryCount);
    } else {
      logger.error('Failed to connect to MongoDB after maximum retries. Exiting process.');
      process.exit(1);
    }
  }
};
