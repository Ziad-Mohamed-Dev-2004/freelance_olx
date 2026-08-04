import { Types } from 'mongoose';

export enum OtpType {
  PHONE_VERIFICATION = 'phone_verification',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

export interface IOtp {
  user?: Types.ObjectId;
  email?: string;
  pendingUserData?: any;
  code: string;
  type: OtpType;
  attempts: number;
  expiresAt: Date;
  isOtpMatch(code: string): Promise<boolean>;
}
