import { Document, Types } from 'mongoose';
import { IUser } from './user.interface';
import { ICategory } from './category.interface';
import { ICity } from './city.interface';
import { IArea } from './area.interface';

export enum RentType {
  DAILY = 'Daily',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
}

export enum PropertyStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  REJECTED = 'Rejected',
  RENTED = 'Rented',
  ARCHIVED = 'Archived',
}

export interface IProperty extends Document {
  owner: Types.ObjectId | IUser;
  category: Types.ObjectId | ICategory;
  city: Types.ObjectId | ICity;
  area: Types.ObjectId | IArea;
  title: string;
  description: string;
  price: number;
  currency: string;
  rentType: RentType;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  areaSize: number;
  furnished: boolean;
  parking: boolean;
  balcony: boolean;
  elevator: boolean;
  airConditioner: boolean;
  internet: boolean;
  kitchen: boolean;
  latitude?: number;
  longitude?: number;
  address: string;
  images: string[];
  status: PropertyStatus;
  featured: boolean;
  views: number;
  publishedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
