import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';
import { logger } from '../utils/logger';

// Configure Cloudinary only if credentials are provided
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  logger.info('Cloudinary initialized successfully');
} else {
  logger.warn('Cloudinary credentials missing. Cloudinary uploads will run in simulation/mock mode.');
}

export default cloudinary;
export const isCloudinaryConfigured = (): boolean => {
  return !!(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);
};
