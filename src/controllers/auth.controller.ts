import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as tokenService from '../services/token.service';
import * as otpService from '../services/otp.service';
import * as emailService from '../services/email.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import logger from '../utils/logger';
import { UserRole } from '../interfaces/user.interface';
import adminLogService from '../services/admin-log.service';

/**
 * POST /auth/register
 * Registers a new user and returns auth tokens.
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const code = await otpService.generateRegistrationOtp(req.body);
  await emailService.sendVerificationOtpEmail(req.body.email, code);
  ApiResponse.success(res, 201, 'Registration initiated. Please verify your email.');
});

/**
 * POST /auth/verify-registration
 * Verifies email OTP and completes registration.
 */
export const verifyRegistration = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;
  const user = await otpService.verifyRegistrationOtp(email, code);
  const tokens = await tokenService.generateAuthTokens(user);
  ApiResponse.success(res, 201, 'Registration verified successfully', { user, tokens });
});

/**
 * POST /auth/resend-registration-otp
 * Resends the registration OTP.
 */
export const resendRegistrationOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const code = await otpService.resendRegistrationOtp(email);
  await emailService.sendVerificationOtpEmail(email, code);
  ApiResponse.success(res, 200, 'OTP resent successfully');
});

/**
 * POST /auth/login
 * Authenticates a user and returns auth tokens.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  if (user.role === UserRole.ADMIN) {
    await adminLogService.create({
      admin: user._id.toString(),
      action: 'ADMIN_LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
  ApiResponse.success(res, 200, 'Login successful', { user, tokens });
});

/**
 * POST /auth/logout
 * Invalidates the refresh token.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  ApiResponse.success(res, 200, 'Logout successful');
});

/**
 * POST /auth/refresh-token
 * Exchanges a valid refresh token for a new access/refresh token pair.
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.refreshAuth(req.body.refreshToken);
  const tokens = await tokenService.generateAuthTokens(user);
  ApiResponse.success(res, 200, 'Tokens refreshed', { tokens });
});

/**
 * POST /auth/forgot-password
 * Generates and "sends" a password reset link (logged to console in dev).
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  // TODO: Replace with real email provider (SMTP / SendGrid / SES)
  logger.info(`Password reset token for ${req.body.email}: ${resetPasswordToken}`);
  ApiResponse.success(res, 200, 'If that email exists, a reset link has been sent');
});

/**
 * POST /auth/reset-password
 * Resets the user's password using the token from query string.
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.query.token as string, req.body.password);
  ApiResponse.success(res, 200, 'Password has been reset successfully');
});

/**
 * GET /auth/me
 * Returns the authenticated user's profile.
 */
export const me = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, 200, 'User profile retrieved', { user: req.user });
});

/**
 * DELETE /auth/me
 * Permanently deletes the authenticated user's account from the database.
 */
export const deleteMyAccount = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.deleteCurrentUserAccount(req.user!._id.toString());
  ApiResponse.success(res, 200, 'Account deleted successfully', result);
});
