import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  logger.error(`${req.method} ${req.originalUrl} - Status ${statusCode} - ${message}`);
  if (statusCode === 500) {
    logger.error(err.stack || '');
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
