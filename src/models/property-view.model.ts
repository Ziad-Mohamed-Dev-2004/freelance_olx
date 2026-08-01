import { Schema, model } from 'mongoose';
import { IPropertyView } from '../interfaces/property-view.interface';

const propertyViewSchema = new Schema<IPropertyView>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  },
  { timestamps: true },
);

// The primary analytics query groups accepted views by creation time.
propertyViewSchema.index({ createdAt: 1 });

export default model<IPropertyView>('PropertyView', propertyViewSchema);
