import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'ADMIN' | 'CUSTOMER';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      throw new AppError(403, 'Insufficient permissions for this action');
    }

    next();
  };
};

export const requireAtLeastRole = (minRole: UserRole) => {
  const roleHierarchy: Record<UserRole, number> = {
    CUSTOMER: 0,
    ADMIN: 1,
    MANAGER: 2,
    SUPER_ADMIN: 3,
  };

  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const userRole = req.user.role as UserRole;
    const userRoleLevel = roleHierarchy[userRole];
    const minRoleLevel = roleHierarchy[minRole];

    if (userRoleLevel < minRoleLevel) {
      throw new AppError(403, 'Insufficient permissions for this action');
    }

    next();
  };
};

// Middleware wrapper for use in routes
export const checkRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const userRole = req.user.role as UserRole;

      if (!allowedRoles.includes(userRole)) {
        throw new AppError(403, 'Insufficient permissions for this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
