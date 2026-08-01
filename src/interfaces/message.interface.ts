import { Document, Types } from 'mongoose';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
}
export interface IMessageAttachment {
  url: string;
  publicId?: string;
  name?: string;
  mimeType?: string;
  size?: number;
  duration?: number;
}
export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  type: MessageType;
  text?: string;
  attachment?: IMessageAttachment;
  deliveredTo: Types.ObjectId[];
  seenBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
