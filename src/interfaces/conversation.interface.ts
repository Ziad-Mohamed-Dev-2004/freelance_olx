import { Document, Types } from 'mongoose';

export interface IConversation extends Document {
  property: Types.ObjectId;
  participants: Types.ObjectId[];
  participantKey: string;
  lastMessage?: Types.ObjectId;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
