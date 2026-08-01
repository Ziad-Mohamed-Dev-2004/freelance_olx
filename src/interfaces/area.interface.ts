import { Document, Types } from 'mongoose';
import { ICity } from './city.interface';

export interface IArea extends Document {
  city: Types.ObjectId | ICity;
  name: string;
  slug: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
