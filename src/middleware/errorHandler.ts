// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { MongoServerError } from 'mongodb';
import mongoose from 'mongoose';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  errors?: Record<string, { message: string }>;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: AppError = { ...err, message: err.message, name: err.name };
  console.error('🔥 Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 404;
    message = `Resource not found with id of ${(err as unknown as { value: string }).value}`;
  }

  // Mongoose duplicate key
  if ((err as MongoServerError).code === 11000) {
    statusCode = 400;
    const field = Object.keys((err as unknown as { keyValue: Record<string, unknown> }).keyValue || {})[0];
    message = `Duplicate value entered for field: ${field || 'unknown'}`;
  }

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Simple operational error class for throwing controlled errors
 * from controllers, e.g. `throw new AppError('Not found', 404)`.
 */
export class AppErrorClass extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
