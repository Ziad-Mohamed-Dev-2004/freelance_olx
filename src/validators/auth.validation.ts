import { z } from 'zod';

const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least 1 letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number');

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email format'),
    password: passwordValidation,
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: passwordValidation,
  }),
  query: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

export const verifyRegistrationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    code: z
      .string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d+$/, 'OTP must contain only numbers'),
  }),
});

export const resendRegistrationOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

export const googleAuthSchema = z.object({
  body: z
    .object({
      idToken: z.string().optional(),
      credential: z.string().optional(),
      code: z.string().optional(),
      redirectUri: z.string().optional(),
    })
    .refine((data) => !!(data.idToken || data.credential || data.code), {
      message: 'Either idToken (credential) or authorization code must be provided',
    }),
});


