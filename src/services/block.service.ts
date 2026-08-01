import blockRepository, { BlockRepository } from '../repositories/block.repository';
import User from '../models/user.model';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/AppError';
import { BlockQuery } from '../types/block.types';

export class BlockService {
  constructor(private readonly blockRepo: BlockRepository = blockRepository) {}
  async block(user: string, blockedUser: string) {
    if (user === blockedUser) throw new BadRequestError('You cannot block yourself');
    if (!(await User.exists({ _id: blockedUser }))) throw new NotFoundError('User not found');
    if (await this.blockRepo.isBlocked(user, blockedUser))
      throw new ConflictError('User is already blocked');
    return this.blockRepo.create({ user: user as any, blockedUser: blockedUser as any });
  }
  async unblock(user: string, blockedUser: string) {
    if (!(await this.blockRepo.remove(user, blockedUser)))
      throw new NotFoundError('Block not found');
  }
  getBlocks(user: string, query: BlockQuery) {
    return this.blockRepo.findUserBlocks(user, query);
  }
  isBlocked(user: string, blockedUser: string) {
    return this.blockRepo.isBlocked(user, blockedUser);
  }
  async hasInteractionBlock(userA: string, userB: string) {
    return (await this.blockRepo.isBlocked(userA, userB)) || this.blockRepo.isBlocked(userB, userA);
  }
}
export default new BlockService();
