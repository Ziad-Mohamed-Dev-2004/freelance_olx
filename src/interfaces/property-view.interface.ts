import { Document, Types } from 'mongoose';

/** An accepted, de-duplicated property view used for analytics. */
export interface IPropertyView extends Document {
  property: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
