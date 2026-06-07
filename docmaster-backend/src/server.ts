import app from './app';
import { config } from './config';
import { connectDB } from './config/db';
import { logger } from './utils/logger';

const startServer = async () => {
  // Connect database
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`Server listening on http://localhost:${config.port}`);
    logger.info(`Swagger docs available at http://localhost:${config.port}/api-docs`);
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (err: any) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
