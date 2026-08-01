import { Schema, model } from 'mongoose';
import { IArea } from '../interfaces/area.interface';

const areaSchema = new Schema<IArea>(
  {
    city: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: [true, 'City ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Area slug is required'],
      unique: true,
      lowercase: true,
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
areaSchema.index({ name: 1 });
areaSchema.index({ city: 1 });
areaSchema.index({ isDeleted: 1 });

const Area = model<IArea>('Area', areaSchema);

export default Area;
