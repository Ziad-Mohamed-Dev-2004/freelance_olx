import conversationRepository, {
  ConversationRepository,
} from '../repositories/conversation.repository';
import Property from '../models/property.model';
import User from '../models/user.model';
import blockService from './block.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import { PaginationQuery } from '../types/chat.types';

const participantKey = (a: string, b: string) => [a, b].sort().join(':');
export class ConversationService {
  constructor(private readonly repo: ConversationRepository = conversationRepository) {}
  async start(ownerId: string, propertyId: string, recipientId?: string) {
    const property = await Property.findOne({ _id: propertyId, isDeleted: false }).select(
      'owner status',
    );
    if (!property) throw new NotFoundError('Property not found');
    const other = recipientId || property.owner.toString();
    if (ownerId === other)
      throw new BadRequestError('You cannot start a conversation with yourself');
    if (!(await User.exists({ _id: other }))) throw new NotFoundError('Recipient not found');
    if (await blockService.hasInteractionBlock(ownerId, other))
      throw new ForbiddenError('Chat is unavailable because one participant has blocked the other');
    const key = participantKey(ownerId, other);
    let conversation = await this.repo.findByPropertyAndParticipants(propertyId, key);
    if (!conversation) {
      try {
        conversation = await this.repo.create({
          property: propertyId as any,
          participants: [ownerId, other] as any,
          participantKey: key,
          lastMessageAt: new Date(),
        } as any);
      } catch {
        conversation = await this.repo.findByPropertyAndParticipants(propertyId, key);
      }
    }
    if (!conversation) throw new BadRequestError('Could not create conversation');
    return this.repo.findById(conversation._id.toString(), [
      { path: 'property', select: 'title images owner status' },
      { path: 'participants', select: 'name avatar' },
      { path: 'lastMessage' },
    ]);
  }
  async get(id: string, user: string) {
    const conversation = await this.repo.findById(id, [
      { path: 'property', select: 'title images owner status' },
      { path: 'participants', select: 'name avatar' },
      { path: 'lastMessage' },
    ]);
    this.assertParticipant(conversation, user);
    return conversation!;
  }
  async assertAccess(id: string, user: string) {
    const conversation = await this.repo.findById(id);
    this.assertParticipant(conversation, user);
    return conversation!;
  }
  list(user: string, query: PaginationQuery) {
    return this.repo.findForUser(user, query);
  }
  private assertParticipant(conversation: any, user: string) {
    if (!conversation) throw new NotFoundError('Conversation not found');
    if (
      !conversation.participants.some(
        (p: any) => p._id?.toString() === user || p.toString() === user,
      )
    )
      throw new ForbiddenError('You do not have access to this conversation');
  }
}
export default new ConversationService();
