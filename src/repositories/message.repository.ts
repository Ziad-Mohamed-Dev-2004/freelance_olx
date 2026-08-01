import Message from '../models/message.model';
import { IMessage } from '../interfaces/message.interface';
import { BaseRepository } from './base.repository';
import { PaginationQuery } from '../types/chat.types';

export class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
    super(Message);
  }
  findByConversation(conversation: string, query: PaginationQuery) {
    return this.findManyWithPagination(
      { conversation },
      { ...query, sort: 'createdAt:desc' },
      { path: 'sender', select: 'name avatar' },
    );
  }
  markDelivered(conversation: string, user: string) {
    return Message.updateMany(
      { conversation, sender: { $ne: user }, deliveredTo: { $ne: user } },
      { $addToSet: { deliveredTo: user } },
    ).exec();
  }
  markSeen(conversation: string, user: string) {
    return Message.updateMany(
      { conversation, sender: { $ne: user }, seenBy: { $ne: user } },
      { $addToSet: { seenBy: user, deliveredTo: user } },
    ).exec();
  }
}
export default new MessageRepository();
