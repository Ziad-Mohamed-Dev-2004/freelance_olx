import messageRepository, { MessageRepository } from '../repositories/message.repository';
import conversationRepository from '../repositories/conversation.repository';
import conversationService from './conversation.service';
import notificationService from './notification.service';
import presenceService from './presence.service';
import blockService from './block.service';
import cloudinaryService from './cloudinary.service';
import { MessageType } from '../interfaces/message.interface';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import { PaginationQuery, SendMessageInput } from '../types/chat.types';

export class MessageService {
  constructor(private readonly repo: MessageRepository = messageRepository) {}
  async send(conversationId: string, senderId: string, input: SendMessageInput) {
    const conversation = await conversationService.assertAccess(conversationId, senderId);
    const receiverId = conversation.participants
      .map((p: any) => p.toString())
      .find((id: string) => id !== senderId)!;
    if (await blockService.hasInteractionBlock(senderId, receiverId))
      throw new ForbiddenError('Chat is unavailable because one participant has blocked the other');
    if (input.type === MessageType.TEXT && !input.text?.trim())
      throw new BadRequestError('Text is required for text messages');
    if (input.type !== MessageType.TEXT && !input.attachment?.url)
      throw new BadRequestError('An attachment URL is required for media messages');
    const delivered = (await presenceService.isOnline(receiverId)) ? [receiverId] : [];
    const message = await this.repo.create({
      conversation: conversationId as any,
      sender: senderId as any,
      type: input.type,
      text: input.text?.trim(),
      attachment: input.attachment,
      deliveredTo: delivered as any,
      seenBy: [senderId] as any,
    } as any);
    await conversationRepository.touch(conversationId, message._id.toString());
    const populated = await this.repo.findById(message._id.toString(), {
      path: 'sender',
      select: 'name avatar',
    });
    if (!delivered.length)
      await notificationService.newMessage(
        receiverId,
        (populated as any)?.sender?.name || 'A user',
        conversationId,
        input.text?.trim() || 'Sent an attachment',
      );
    return { message: populated!, receiverId, delivered: Boolean(delivered.length) };
  }
  async history(conversationId: string, userId: string, query: PaginationQuery) {
    await conversationService.assertAccess(conversationId, userId);
    return this.repo.findByConversation(conversationId, query);
  }
  async delivered(conversationId: string, userId: string) {
    await conversationService.assertAccess(conversationId, userId);
    return this.repo.markDelivered(conversationId, userId);
  }
  async seen(conversationId: string, userId: string) {
    const conversation = await conversationService.assertAccess(conversationId, userId);
    await this.repo.markSeen(conversationId, userId);
    return conversation.participants
      .map((p: any) => p.toString())
      .filter((id: string) => id !== userId);
  }
  async remove(conversationId: string, messageId: string, userId: string) {
    await conversationService.assertAccess(conversationId, userId);
    const message = await this.repo.findOne({ _id: messageId, conversation: conversationId });
    if (!message) throw new NotFoundError('Message not found');
    if (message.sender.toString() !== userId)
      throw new ForbiddenError('You can only delete your own messages');
    if (message.attachment?.url) await cloudinaryService.deleteImage(message.attachment.url);
    const conversation = await conversationRepository.findById(conversationId);
    const wasLastMessage = conversation?.lastMessage?.toString() === messageId;
    if (!(await this.repo.deleteById(messageId))) throw new NotFoundError('Message not found');
    if (wasLastMessage) {
      const latest = await this.repo.findLatestInConversation(conversationId);
      if (latest) {
        await conversationRepository.touch(conversationId, latest._id.toString());
      } else {
        await conversationRepository.updateById(conversationId, {
          lastMessage: null,
          lastMessageAt: conversation?.createdAt || new Date(),
        });
      }
    }
    return { messageId, conversationId };
  }
}
export default new MessageService();
