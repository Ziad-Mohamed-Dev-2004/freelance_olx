import { Schema, model, Types, Document } from 'mongoose';
export interface IDeviceToken extends Document {
  user: Types.ObjectId;
  token: string;
  platform?: 'ios' | 'android' | 'web';
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IDeviceToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ['ios', 'android', 'web'] },
  },
  { timestamps: true },
);
schema.index({ user: 1 });
export default model<IDeviceToken>('DeviceToken', schema);
