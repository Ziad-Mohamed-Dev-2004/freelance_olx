import { z } from 'zod';
import { OtpType } from '../interfaces/otp.interface';

export const verifyOtpSchema = z.object({
  body: z.object({
    type: z.nativeEnum(OtpType),
    code: z
      .string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d+$/, 'OTP must contain only numbers'),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    type: z.nativeEnum(OtpType),
  }),
});
