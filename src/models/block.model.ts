import { Schema, model } from 'mongoose';
import { IBlock } from '../interfaces/block.interface';

const blockSchema = new Schema<IBlock>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blockedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);
blockSchema.index({ user: 1, blockedUser: 1 }, { unique: true });
blockSchema.index({ user: 1, createdAt: -1 });
blockSchema.index({ blockedUser: 1 });
export default model<IBlock>('Block', blockSchema);
