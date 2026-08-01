import { Types } from 'mongoose';
import crypto from 'crypto';
import Otp from '../models/otp.model';
import User from '../models/user.model';
import { OtpType } from '../interfaces/otp.interface';
import { NotFoundError, BadRequestError } from '../utils/AppError';

const MAX_ATTEMPTS = 5;
const EXPIRATION_MINUTES = 5;

const generateRandom6DigitNumber = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generates a 6-digit OTP for the given user and type.
 * Clears any existing OTP of the same type before creating a new one.
 * Returns the plain OTP (to be delivered via SMS/email before being discarded).
 */
export const generateOtp = async (
  userId: string | Types.ObjectId,
  type: OtpType,
): Promise<string> => {
  await Otp.deleteMany({ user: userId, type });

  const code = generateRandom6DigitNumber();
  const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000);

  await Otp.create({ user: userId, code, type, expiresAt });

  return code;
};

/**
 * Re-generates an OTP for the given user and type.
 */
export const resendOtp = async (
  userId: string | Types.ObjectId,
  type: OtpType,
): Promise<string> => {
  return generateOtp(userId, type);
};

/**
 * Verifies the OTP code for a user.
 * - Enforces MAX_ATTEMPTS limit (deletes OTP if exceeded).
 * - Deletes the OTP after successful verification.
 * - Updates the relevant verified flag on the user document.
 */
export const verifyOtp = async (
  userId: string | Types.ObjectId,
  type: OtpType,
  code: string,
): Promise<void> => {
  const otpDoc = await Otp.findOne({ user: userId, type });

  if (!otpDoc) {
    throw new NotFoundError('OTP not found or has expired. Please request a new one.');
  }

  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    await otpDoc.deleteOne();
    throw new BadRequestError('Maximum OTP attempts exceeded. Please request a new code.');
  }

  const isMatch = await otpDoc.isOtpMatch(code);

  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = MAX_ATTEMPTS - otpDoc.attempts;
    throw new BadRequestError(`Invalid OTP. ${remaining} attempt(s) remaining.`);
  }

  await otpDoc.deleteOne();

  const user = await User.findById(userId);
  if (user) {
    if (type === OtpType.PHONE_VERIFICATION) {
      user.isPhoneVerified = true;
    } else if (type === OtpType.EMAIL_VERIFICATION) {
      user.isEmailVerified = true;
    }
    await user.save();
  }
};
