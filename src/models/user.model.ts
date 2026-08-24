import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, UserStatus } from '../interfaces/user.interface';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },
    avatar: {
      type: String,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  },
);

userSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
userSchema.index({ role: 1, isDeleted: 1, createdAt: -1 });
userSchema.index({ name: 1, email: 1, phone: 1 });

// Check if password matches the user's password
userSchema.methods.isPasswordMatch = async function (password: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(password, this.password);
};

// Hash the password before saving
userSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 8);
  }
});

// Transform the document when converting to JSON (e.g. sending via API)
userSchema.set('toJSON', {
  transform: (_doc: object, ret: Record<string, any>) => {
    delete ret.password; // Never expose the password
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
