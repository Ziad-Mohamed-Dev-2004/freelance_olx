import messageRepository, { MessageRepository } from '../repositories/message.repository';
import conversationRepository from '../repositories/conversation.repository';
import conversationService from './conversation.service';
import notificationService from './notification.service';
import presenceService from './presence.service';
import blockService from './block.service';
import cloudinaryService from './cloudinary.service';
import { IMessage } from '../interfaces/message.interface';
import { MessageType } from '../interfaces/message.interface';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import {
  BulkDeleteMessagesInput,
  MessageDeleteResult,
  PaginationQuery,
  SendMessageInput,
} from '../types/chat.types';

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
    const result = await this.removeMany(conversationId, userId, { messageIds: [messageId] });
    return { messageId: result.messageIds[0], conversationId: result.conversationId };
  }
  async removeMany(
    conversationId: string,
    userId: string,
    input: BulkDeleteMessagesInput,
  ): Promise<MessageDeleteResult> {
    await conversationService.assertAccess(conversationId, userId);
    const messageIds = [...new Set(input.messageIds)];
    if (!messageIds.length) throw new BadRequestError('Select at least one message');
    const messages = await this.repo.findByIdsInConversation(conversationId, messageIds);
    if (messages.length !== messageIds.length)
      throw new NotFoundError('One or more messages were not found in this conversation');
    if (messages.some((message) => message.sender.toString() !== userId))
      throw new ForbiddenError('You can only delete your own messages');
    await this.deleteAttachments(messages);
    await this.repo.deleteManyByIds(messageIds);
    await this.syncLastMessage(conversationId);
    return { conversationId, messageIds, deletedCount: messageIds.length };
  }
  async removeAll(conversationId: string, userId: string): Promise<MessageDeleteResult> {
    await conversationService.assertAccess(conversationId, userId);
    const messages = await this.repo.findAllInConversation(conversationId);
    if (!messages.length) return { conversationId, messageIds: [], deletedCount: 0 };
    const messageIds = messages.map((message) => message._id.toString());
    await this.deleteAttachments(messages);
    await this.repo.deleteAllInConversation(conversationId);
    await this.syncLastMessage(conversationId);
    return { conversationId, messageIds, deletedCount: messageIds.length };
  }
  private async deleteAttachments(messages: IMessage[]) {
    await Promise.all(
      messages
        .filter((message) => message.attachment?.url)
        .map((message) => cloudinaryService.deleteImage(message.attachment!.url)),
    );
  }
  private async syncLastMessage(conversationId: string) {
    const conversation = await conversationRepository.findById(conversationId);
    const latest = await this.repo.findLatestInConversation(conversationId);
    if (latest) {
      await conversationRepository.touch(conversationId, latest._id.toString());
      return;
    }
    await conversationRepository.updateById(conversationId, {
      lastMessage: null,
      lastMessageAt: conversation?.createdAt || new Date(),
    });
  }
}
export default new MessageService();
