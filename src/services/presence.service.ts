import redisService from './redis.service';

export class PresenceService {
  private userKey(userId: string) {
    return `chat:online:${userId}`;
  }
  async connect(userId: string, socketId: string) {
    await redisService.setAdd(this.userKey(userId), socketId, 86400);
  }
  async disconnect(userId: string, socketId: string) {
    await redisService.setRemove(this.userKey(userId), socketId);
  }
  async isOnline(userId: string) {
    return (await redisService.setSize(this.userKey(userId))) > 0;
  }
  async socketIds(userId: string) {
    return redisService.setMembers(this.userKey(userId));
  }
}
export default new PresenceService();
