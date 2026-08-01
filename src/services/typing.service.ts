import redisService from './redis.service';
export class TypingService {
  private key(conversationId: string, userId: string) {
    return `chat:typing:${conversationId}:${userId}`;
  }
  start(conversationId: string, userId: string) {
    return redisService.set(this.key(conversationId, userId), '1', 10);
  }
  stop(conversationId: string, userId: string) {
    return redisService.delete(this.key(conversationId, userId));
  }
}
export default new TypingService();
