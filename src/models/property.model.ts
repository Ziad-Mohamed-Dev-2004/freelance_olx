import { Schema, model } from 'mongoose';
import { IProperty, PropertyStatus, RentType } from '../interfaces/property.interface';

const propertySchema = new Schema<IProperty>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    area: { type: Schema.Types.ObjectId, ref: 'Area', required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: 'EGP',
      maxlength: 3,
    },
    rentType: { type: String, enum: Object.values(RentType), required: true },
    propertyType: { type: String, required: true, trim: true, maxlength: 80 },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    floor: { type: Number, default: null },
    areaSize: { type: Number, required: true, min: 0 },
    furnished: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    elevator: { type: Boolean, default: false },
    airConditioner: { type: Boolean, default: false },
    internet: { type: Boolean, default: false },
    kitchen: { type: Boolean, default: false },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    images: {
      type: [String],
      default: [],
      validate: [(images: string[]) => images.length <= 10, 'Maximum 10 images allowed'],
    },
    status: { type: String, enum: Object.values(PropertyStatus), default: PropertyStatus.PENDING },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0, min: 0 },
    publishedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

propertySchema.index({ owner: 1, isDeleted: 1, createdAt: -1 });
propertySchema.index({ status: 1, isDeleted: 1, publishedAt: -1 });
propertySchema.index({ category: 1, city: 1, area: 1, isDeleted: 1 });
propertySchema.index({ price: 1, rentType: 1, isDeleted: 1 });
propertySchema.index({ title: 'text', description: 'text', address: 'text' });
// Individual indexes support the primary filters and dashboard queries.
propertySchema.index({ title: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ category: 1 });
propertySchema.index({ city: 1 });
propertySchema.index({ area: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ featured: 1 });
propertySchema.index({ views: -1 });
propertySchema.index({ createdAt: -1 });

export default model<IProperty>('Property', propertySchema);
