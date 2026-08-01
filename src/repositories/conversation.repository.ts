import Conversation from '../models/conversation.model';
import { IConversation } from '../interfaces/conversation.interface';
import { BaseRepository } from './base.repository';
import { PaginationQuery } from '../types/chat.types';

export class ConversationRepository extends BaseRepository<IConversation> {
  constructor() {
    super(Conversation);
  }
  findByPropertyAndParticipants(property: string, participantKey: string) {
    return this.findOne({ property, participantKey }, [
      { path: 'property', select: 'title images owner status' },
      { path: 'participants', select: 'name avatar' },
      { path: 'lastMessage' },
    ]);
  }
  findForUser(user: string, query: PaginationQuery) {
    return this.findManyWithPagination(
      { participants: user },
      { ...query, sort: 'lastMessageAt:desc' },
      [
        { path: 'property', select: 'title images owner status' },
        { path: 'participants', select: 'name avatar' },
        { path: 'lastMessage' },
      ],
    );
  }
  touch(id: string, messageId: string) {
    return this.updateById(id, { lastMessage: messageId, lastMessageAt: new Date() });
  }
}
export default new ConversationRepository();
