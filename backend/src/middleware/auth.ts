import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { AppError } from './errorHandler';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
    }
  }
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token

    if (!token) {
      throw new AppError(401, 'No authorization token provided');
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    req.userId = decoded.id;

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      req.userId = decoded.id;
    }

    next();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    // Continue without auth if token is invalid
    next();
  }
};
