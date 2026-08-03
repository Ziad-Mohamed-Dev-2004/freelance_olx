import { Request, Response } from 'express';
import * as otpService from '../services/otp.service';
import * as emailService from '../services/email.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { OtpType } from '../interfaces/otp.interface';
import logger from '../utils/logger';

/**
 * POST /auth/verify-otp
 * Verifies the submitted 6-digit OTP for the authenticated user.
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { type, code } = req.body;
  await otpService.verifyOtp(req.user!._id as unknown as string, type, code);
  ApiResponse.success(res, 200, 'OTP verified successfully');
});

/**
 * POST /auth/resend-otp
 * Generates a new OTP and sends it to the user's email.
 */
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.body;
  const code = await otpService.resendOtp(req.user!._id as unknown as string, type);

  if (type === OtpType.EMAIL_VERIFICATION) {
    await emailService.sendVerificationOtpEmail(req.user!.email, code);
  } else {
    logger.info(`OTP for ${req.user!.email} [${type}]: ${code}`);
  }

  ApiResponse.success(res, 200, 'OTP sent successfully');
});
