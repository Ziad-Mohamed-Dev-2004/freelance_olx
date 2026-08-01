import { Schema, model } from 'mongoose';
import { IConversation } from '../interfaces/conversation.interface';

const conversationSchema = new Schema<IConversation>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    participantKey: { type: String, required: true },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
conversationSchema.index({ property: 1, participantKey: 1 }, { unique: true });
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
export default model<IConversation>('Conversation', conversationSchema);
