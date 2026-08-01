import { Schema, model } from 'mongoose';
import { IMessage, MessageType } from '../interfaces/message.interface';

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    name: String,
    mimeType: String,
    size: Number,
    duration: Number,
  },
  { _id: false },
);
const messageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(MessageType), default: MessageType.TEXT },
    text: { type: String, trim: true, maxlength: 4000 },
    attachment: attachmentSchema,
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    seenBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });
export default model<IMessage>('Message', messageSchema);
