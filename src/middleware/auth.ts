// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import { AppErrorClass } from './errorHandler.js';
import User from '../models/User.js';
import { IUser, PostCategory, UserRole, canUserManageCategory } from '../types/index.js';

// ===============================
// EXPORT THIS - Makes it available to other files
// ===============================
export interface AuthRequest extends Request {
  user?: IUser;
}

// ===============================
// PROTECT - Authenticate User
// ===============================
export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new AppErrorClass('Not authorized. Please log in.', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppErrorClass('Server misconfiguration: JWT secret missing.', 500);
  }

  const decoded = jwt.verify(token, secret) as { id: string };

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppErrorClass('User belonging to this token no longer exists.', 401);
  }

  if (!user.isActive) {
    throw new AppErrorClass('This account has been deactivated. Contact a Super Admin.', 403);
  }

  (req as AuthRequest).user = user;
  next();
});

// ===============================
// OPTIONAL AUTH
// ===============================
export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string };
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      (req as AuthRequest).user = user;
    }
  } catch {
    // Invalid/expired token on a public route: proceed as anonymous
  }

  next();
});

// ===============================
// AUTHORIZE - Role-based access
// ===============================
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      throw new AppErrorClass('Not authorized. Please log in.', 401);
    }
    if (!roles.includes(authReq.user.role)) {
      throw new AppErrorClass(
        `Role '${authReq.user.role}' is not permitted to perform this action.`,
        403
      );
    }
    next();
  };
};

// ===============================
// SUPER ADMIN ONLY
// ===============================
export const superAdminOnly = (req: Request, _res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    throw new AppErrorClass('Not authenticated', 401);
  }
  if (authReq.user.role === 'super_admin') {
    next();
    return;
  }
  throw new AppErrorClass('Super admin privileges required', 403);
};

// ===============================
// CAN MANAGE CATEGORY
// ===============================
export const canManageCategory = (
  category: PostCategory | ((req: Request) => PostCategory)
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      throw new AppErrorClass('Not authorized. Please log in.', 401);
    }

    const resolvedCategory = typeof category === 'function' ? category(req) : category;

    if (!canUserManageCategory(authReq.user.role, resolvedCategory)) {
      throw new AppErrorClass(
        `Your role does not have permission to manage '${resolvedCategory}' content.`,
        403
      );
    }
    next();
  };
};

// ===============================
// ALIAS - Admin Only (Any admin role)
// ===============================
export const adminOnly = (req: Request, _res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    throw new AppErrorClass('Not authenticated', 401);
  }

  const adminRoles: UserRole[] = [
    'super_admin',
    'gallery_admin',
    'news_admin',
    'history_admin',
    'entertainment_admin',
    'health_admin',
    'technology_admin',
    'vacancy_admin'
  ];

  if (adminRoles.includes(authReq.user.role)) {
    next();
    return;
  }
  throw new AppErrorClass('Admin privileges required', 403);
};