import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IOtp, OtpType } from '../interfaces/otp.interface';

const otpSchema = new Schema<IOtp>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    pendingUserData: {
      type: Schema.Types.Mixed,
      required: false,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(OtpType),
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '0s' }, // TTL index to automatically delete expired docs
    },
  },
  {
    timestamps: true,
  },
);

otpSchema.methods.isOtpMatch = async function (code: string): Promise<boolean> {
  return bcrypt.compare(code, this.code);
};

otpSchema.pre('save', async function () {
  if (this.isModified('code') && this.code) {
    this.code = await bcrypt.hash(this.code, 8);
  }
});

const Otp = mongoose.model<IOtp>('Otp', otpSchema);
export default Otp;
