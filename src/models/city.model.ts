import { Schema, model } from 'mongoose';
import { ICity } from '../interfaces/city.interface';

const citySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: [true, 'City name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'City slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    governorate: {
      type: String,
      required: [true, 'Governorate is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// MongoDB Indexes
citySchema.index({ governorate: 1 });
citySchema.index({ isDeleted: 1 });

const City = model<ICity>('City', citySchema);

export default City;
