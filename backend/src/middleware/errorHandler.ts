import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Token expired',
    });
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientValidationError') {
    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Invalid data provided',
    });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error - Prisma error code property
    if ((err as Record<string, unknown>).code === 'P2002') {
      res.status(409).json({
        status: 'error',
        statusCode: 409,
        message: 'Unique constraint violation',
      });
      return;
    }
  }

  // Generic error
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  console.error('Unhandled Error:', err);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
};
