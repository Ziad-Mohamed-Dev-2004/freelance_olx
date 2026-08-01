import { Document, Types } from 'mongoose';
import { IUser } from './user.interface';
import { IProperty } from './property.interface';

export interface IFavorite extends Document {
  user: Types.ObjectId | IUser;
  property: Types.ObjectId | IProperty;
  createdAt: Date;
  updatedAt: Date;
}
