import { Document, Types } from 'mongoose';

export enum TokenType {
  REFRESH = 'refresh',
  RESET_PASSWORD = 'resetPassword',
}

export interface IToken extends Document {
  token: string;
  user: Types.ObjectId;
  type: TokenType;
  expires: Date;
  blacklisted: boolean;
}
