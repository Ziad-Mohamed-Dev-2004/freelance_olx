import { Schema, model } from 'mongoose';
import { IFavorite } from '../interfaces/favorite.interface';

const favoriteSchema = new Schema<IFavorite>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  },
  { timestamps: true },
);
favoriteSchema.index({ user: 1, property: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });
favoriteSchema.index({ property: 1 });
favoriteSchema.index({ createdAt: -1 });
export default model<IFavorite>('Favorite', favoriteSchema);
