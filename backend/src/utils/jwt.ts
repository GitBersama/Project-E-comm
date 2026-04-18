import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
  // @ts-expect-error - Type compatibility with jsonwebtoken@9.0.3
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY,
  });
};

export const generateRefreshToken = (payload: { id: string }): string => {
  // @ts-expect-error - Type compatibility with jsonwebtoken@9.0.3
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
};

export const decodeToken = (token: string) => {
  return jwt.decode(token);
};
