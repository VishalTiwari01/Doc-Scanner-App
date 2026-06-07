import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongo.uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error(`Database connection error: ${error.message}`);
    logger.warn('Database offline. Server starting in mock-database in-memory mode.');
  }
};
