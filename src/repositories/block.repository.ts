import Block from '../models/block.model';
import { IBlock } from '../interfaces/block.interface';
import { BaseRepository } from './base.repository';
import { BlockQuery } from '../types/block.types';

export class BlockRepository extends BaseRepository<IBlock> {
  constructor() {
    super(Block);
  }
  isBlocked(user: string, blockedUser: string): Promise<boolean> {
    return this.exists({ user, blockedUser });
  }
  async findUserBlocks(user: string, query: BlockQuery) {
    return this.findManyWithPagination(
      { user },
      {
        page: query.page,
        limit: query.limit,
        sort: query.sort === 'oldest' ? 'createdAt:asc' : 'createdAt:desc',
      },
      { path: 'blockedUser', select: 'name email phone avatar' },
    );
  }
  remove(user: string, blockedUser: string): Promise<IBlock | null> {
    return Block.findOneAndDelete({ user, blockedUser }).exec();
  }
}
export default new BlockRepository();
