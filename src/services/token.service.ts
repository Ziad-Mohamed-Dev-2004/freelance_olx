import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { config } from '../config/env.config';
import Token from '../models/token.model';
import { TokenType, IToken } from '../interfaces/token.interface';
import { IUser } from '../interfaces/user.interface';
import User from '../models/user.model';
import { NotFoundError, UnauthorizedError } from '../utils/AppError';

/**
 * Generates a signed JWT.
 * Refresh tokens use a separate secret (JWT_REFRESH_SECRET) for enhanced security.
 */
export const generateToken = (
  userId: Types.ObjectId | string,
  expires: Date,
  type: TokenType | 'access',
  secret: string = config.jwt.secret,
): string => {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expires.getTime() / 1000),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Persists a token document to MongoDB for stateful validation.
 */
export const saveToken = async (
  token: string,
  userId: Types.ObjectId | string,
  expires: Date,
  type: TokenType,
  blacklisted = false,
): Promise<IToken> => {
  return Token.create({ token, user: userId, expires, type, blacklisted });
};

/**
 * Verifies a JWT and checks that a matching, non-blacklisted token doc exists in the DB.
 * Uses the correct secret based on token type.
 */
export const verifyToken = async (token: string, type: TokenType): Promise<IToken> => {
  const secret = type === TokenType.REFRESH ? config.jwt.refreshSecret : config.jwt.secret;

  let payload: { sub: string };
  try {
    payload = jwt.verify(token, secret) as { sub: string };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  });

  if (!tokenDoc) {
    throw new UnauthorizedError('Token not found or already used');
  }
  return tokenDoc;
};

/**
 * Generates a short-lived access token and a long-lived refresh token for a user.
 */
export const generateAuthTokens = async (user: IUser) => {
  const accessTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const accessToken = generateToken(
    user._id as unknown as string,
    accessTokenExpires,
    'access',
    config.jwt.secret,
  );

  const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const refreshToken = generateToken(
    user._id as unknown as string,
    refreshTokenExpires,
    TokenType.REFRESH,
    config.jwt.refreshSecret,
  );
  await saveToken(
    refreshToken,
    user._id as unknown as string,
    refreshTokenExpires,
    TokenType.REFRESH,
  );

  return {
    access: { token: accessToken, expires: accessTokenExpires },
    refresh: { token: refreshToken, expires: refreshTokenExpires },
  };
};

/**
 * Generates and stores a password reset token for the given email.
 */
export const generateResetPasswordToken = async (email: string): Promise<string> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError('No user found with this email address');
  }
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const resetPasswordToken = generateToken(
    user._id as unknown as string,
    expires,
    TokenType.RESET_PASSWORD,
    config.jwt.secret,
  );
  await saveToken(
    resetPasswordToken,
    user._id as unknown as string,
    expires,
    TokenType.RESET_PASSWORD,
  );
  return resetPasswordToken;
};
