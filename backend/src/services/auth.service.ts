import prisma from '../config/database';
import { hashPassword, comparePasswords } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../schemas/auth.schemas';

export class AuthService {
  async register(input: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AppError(409, 'Email is already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        phone: input.phone,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    // Save refresh token to database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
      },
    });

    // Log activity
    await this.logActivity(user.id, 'USER_REGISTERED', 'User', user.id);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'Account is not active');
    }

    // Verify password
    const isPasswordCorrect = await comparePasswords(input.password, user.password);

    if (!isPasswordCorrect) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    // Save refresh token to database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
      },
    });

    // Log activity
    await this.logActivity(user.id, 'USER_LOGIN', 'User', user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    // Verify refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new AppError(401, 'Invalid refresh token');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      throw new AppError(401, 'Refresh token has expired');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(401, 'User not found or inactive');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }

  async logout(refreshToken: string, userId: string) {
    // Delete refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
        userId,
      },
    });

    // Log activity
    await this.logActivity(userId, 'USER_LOGOUT', 'User', userId);

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        addresses: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  private async logActivity(
    userId: string | null,
    action: string,
    entity: string,
    entityId: string
  ) {
    try {
      await prisma.activityLog.create({
        data: {
          userId: userId || undefined,
          action,
          entity,
          entityId,
        },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
}

export const authService = new AuthService();
