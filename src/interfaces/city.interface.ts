import { Document } from 'mongoose';

export interface ICity extends Document {
  name: string;
  slug: string;
  governorate: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
