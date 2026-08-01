import { Document, Types } from 'mongoose';
import { IUser } from './user.interface';

export interface IBlock extends Document {
  user: Types.ObjectId | IUser;
  blockedUser: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}
