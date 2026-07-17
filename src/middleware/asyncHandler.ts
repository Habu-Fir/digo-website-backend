// src/middleware/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so any rejected promise is
 * forwarded to Express's error handling middleware instead of
 * crashing the process or requiring a try/catch in every controller.
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
