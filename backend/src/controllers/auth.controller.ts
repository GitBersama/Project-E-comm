import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { RegisterInput, LoginInput } from '../schemas/auth.schemas';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as RegisterInput;
    const result = await authService.register(input);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as LoginInput;
    const result = await authService.login(input);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Refresh token not found',
      });
      return;
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Token refreshed',
      data: result,
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const userId = req.userId;

    if (refreshToken && userId) {
      await authService.logout(refreshToken, userId);
    }

    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Logged out successfully',
    });
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const user = await authService.getProfile(userId);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: user,
    });
  });
}

export const authController = new AuthController();
