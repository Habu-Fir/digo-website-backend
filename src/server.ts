// backend/src/server.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';


import connectDB from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import articleRoutes from './routes/article.routes';
import galleryRoutes from './routes/gallery.routes';
import eventRoutes from './routes/event.routes';
import investmentRoutes from './routes/investment.routes';
import statsRoutes from './routes/stats.routes'
import landmarkRoutes from './routes/landmark.routes';

// Load environment variables
dotenv.config();

// Connect database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// CORS
// ===============================
// Build the list of allowed origins. Always allow common local dev ports,
// and additionally allow the deployed frontend URL(s) from env vars.
// FRONTEND_URL can be a single URL or a comma-separated list of URLs.
const localOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
];

const productionOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

const allowedOrigins = [...localOrigins, ...productionOrigins];

console.log('✅ Allowed CORS origins:', allowedOrigins);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`❌ Blocked by CORS: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

// ===============================
// Middleware
// ===============================
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

app.use(cors(corsOptions));

app.use(compression());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ===============================
// Static uploads
// ===============================
const uploadsPath = path.resolve(__dirname, '../uploads');

console.log('📁 Upload folder:', uploadsPath);

app.use('/uploads', express.static(uploadsPath));

// Optional request logger
app.use('/uploads', (req, _res, next) => {
  console.log(`📸 ${req.method} ${req.originalUrl}`);
  next();
});

// ===============================
// Health Check
// ===============================
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    server: 'running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// API Routes
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/landmarks', landmarkRoutes);
app.use('/api/stats', statsRoutes);

// ===============================
// 404
// ===============================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ===============================
// Error Handler
// ===============================
app.use(errorHandler);

// ===============================
// Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log(`📸 Uploads: http://localhost:${PORT}/uploads`);
});

export default app;