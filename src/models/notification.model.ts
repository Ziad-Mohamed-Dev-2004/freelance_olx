import { Schema, model } from 'mongoose';
import { INotification, NotificationType } from '../interfaces/notification.interface';

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    link: { type: String, maxlength: 500 },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
export default model<INotification>('Notification', notificationSchema);
