import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';

const app: Express = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Cookies
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================================================
// ROUTES
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: 'Route not found',
  });
});

// ============================================================================
// ERROR HANDLER (must be last)
// ============================================================================

app.use(errorHandler);

// ============================================================================
// SERVER
// ============================================================================

const startServer = async () => {
  try {
    app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`✅ Server running on http://localhost:${env.PORT}`);
      // eslint-disable-next-line no-console
      console.log(`📊 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export { app, startServer };
