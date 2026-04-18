import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Email (SMTP)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'noreply@ecommerce.com',

  // Payment (Xendit)
  XENDIT_API_KEY: process.env.XENDIT_API_KEY || '',
  XENDIT_WEBHOOK_TOKEN: process.env.XENDIT_WEBHOOK_TOKEN || '',

  // Shipping APIs
  GRAB_API_KEY: process.env.GRAB_API_KEY || '',
  GRAB_CLIENT_ID: process.env.GRAB_CLIENT_ID || '',
  GOJEK_GOSEND_API_KEY: process.env.GOJEK_GOSEND_API_KEY || '',
  RAJAONGKIR_API_KEY: process.env.RAJAONGKIR_API_KEY || '',

  // Kurir Toko defaults
  KURIR_TOKO_BASE_FARE: parseFloat(process.env.KURIR_TOKO_BASE_FARE || '5000'),
  KURIR_TOKO_DISCOUNT_PERCENT: parseFloat(process.env.KURIR_TOKO_DISCOUNT_PERCENT || '20'),
  KURIR_TOKO_MIN_CHARGE: parseFloat(process.env.KURIR_TOKO_MIN_CHARGE || '2000'),

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',

  // Redis (optional)
  REDIS_URL: process.env.REDIS_URL,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
} as const;
