import dotenv from 'dotenv';
import path from 'path';

// Load .env using absolute path from project root so it always resolves
// correctly regardless of which directory ts-node-dev was launched from
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || '5000',
  env: process.env.NODE_ENV || 'development',
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/docmaster',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'docmaster_super_secret_access_key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'docmaster_super_secret_refresh_key',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  google: {
    visionCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || (process.env.RENDER ? '465' : '587'), 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'DocMaster AI',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@docmaster.com',
  },
};
