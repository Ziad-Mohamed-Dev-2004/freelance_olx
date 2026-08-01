import { Document } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  SUSPENDED = 'suspended',
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  failedLoginAttempts: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isPasswordMatch(password: string): Promise<boolean>;
}
