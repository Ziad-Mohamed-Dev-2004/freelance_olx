import { MessageType } from '../interfaces/message.interface';
export interface PaginationQuery {
  page: number;
  limit: number;
}
export interface SendMessageInput {
  type: MessageType;
  text?: string;
  attachment?: {
    url: string;
    publicId?: string;
    name?: string;
    mimeType?: string;
    size?: number;
    duration?: number;
  };
}
export interface BulkDeleteMessagesInput {
  messageIds: string[];
}
export interface MessageDeleteResult {
  conversationId: string;
  messageIds: string[];
  deletedCount: number;
}
