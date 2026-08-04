import User from '../models/user.model';
import Token from '../models/token.model';
import { TokenType } from '../interfaces/token.interface';
import { verifyToken } from './token.service';
import userAccountService from './user-account.service';
import { ConflictError, UnauthorizedError, BadRequestError } from '../utils/AppError';
import { UserRole, UserStatus } from '../interfaces/user.interface';

/**
 * Registers a new user.
 * Throws ConflictError if the email is already in use.
 */
export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) => {
  if (await User.findOne({ email: userData.email })) {
    throw new ConflictError('Email address is already registered');
  }
  const user = await User.create(userData);
  return user;
};

/**
 * Validates email/password credentials and returns the user.
 * Throws UnauthorizedError for invalid credentials.
 */
export const loginUserWithEmailAndPassword = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (
    !user ||
    user.isDeleted ||
    user.status !== UserStatus.ACTIVE ||
    !(await user.isPasswordMatch(password))
  ) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  if (user.role !== UserRole.ADMIN && !user.isEmailVerified) {
    throw new UnauthorizedError('Please verify your email OTP before logging in');
  }

  return user;
};

/**
 * Invalidates a refresh token by deleting it from the database.
 */
export const logout = async (refreshToken: string) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: TokenType.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new BadRequestError('Refresh token not found');
  }
  await refreshTokenDoc.deleteOne();
};

/**
 * Exchanges a valid refresh token for a user object.
 * The caller (controller) is responsible for generating new tokens.
 */
export const refreshAuth = async (refreshToken: string) => {
  const refreshTokenDoc = await verifyToken(refreshToken, TokenType.REFRESH);
  const user = await User.findById(refreshTokenDoc.user);
  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedError('User not found');
  }
  await refreshTokenDoc.deleteOne();
  return user;
};

/**
 * Resets the user's password using a valid reset token.
 */
export const resetPassword = async (resetPasswordToken: string, newPassword: string) => {
  const resetPasswordTokenDoc = await verifyToken(resetPasswordToken, TokenType.RESET_PASSWORD);
  const user = await User.findById(resetPasswordTokenDoc.user);
  if (!user) {
    throw new BadRequestError('Password reset failed: user not found');
  }
  user.password = newPassword;
  await user.save(); // pre-save hook will hash it
  await Token.deleteMany({ user: user._id, type: TokenType.RESET_PASSWORD });
};

/**
 * Soft deletes the current user's account and revokes active auth artifacts.
 */
export const deleteCurrentUserAccount = async (userId: string) => {
  return userAccountService.softDelete(userId);
};
