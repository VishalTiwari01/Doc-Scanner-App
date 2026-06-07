import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'DocMaster AI API is running' });
});

// Main router mount point (placeholder to prevent errors, actual routers will be mounted here in subsequent phases)
import router from './routes';
app.use('/api/v1', router);

// Error handling
app.use(errorHandler);

export default app;
