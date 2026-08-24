import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  mongoose: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_olx',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_access_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_me',
    accessExpirationMinutes: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    propertyViewTtlSeconds: parseInt(process.env.PROPERTY_VIEW_TTL_SECONDS || '600', 10),
  },
  socket: { corsOrigin: process.env.SOCKET_CORS_ORIGIN || '*' },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
  },
  imageStorage: (process.env.IMAGE_STORAGE || 'cloudinary') as 'cloudinary' | 'local',
  publicBaseUrl:
    process.env.PUBLIC_BASE_URL ||
    `http://localhost:${parseInt(process.env.PORT || '3000', 10)}`,
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '"شقتي" <noreply@sheqaty.com>',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },

};

