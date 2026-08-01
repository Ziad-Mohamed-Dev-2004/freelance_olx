import { Request, Response } from 'express';
import * as otpService from '../services/otp.service';
import * as smsService from '../services/sms.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
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
 * Generates a new OTP and sends it via SMS (for phone_verification)
 * or logs it to the console (for other types during development).
 */
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.body;
  const code = await otpService.resendOtp(req.user!._id as unknown as string, type);

  if (type === 'phone_verification' && req.user!.phone) {
    await smsService.sendSms(
      req.user!.phone,
      `Your Olx Clone verification code is: ${code}. Valid for 5 minutes.`,
    );
  } else {
    // For email OTP types, log until an email provider is integrated
    logger.info(`OTP for ${req.user!.email} [${type}]: ${code}`);
  }

  ApiResponse.success(res, 200, 'OTP sent successfully');
});
