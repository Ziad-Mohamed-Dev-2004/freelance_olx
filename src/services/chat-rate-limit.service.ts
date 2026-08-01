import redisService from './redis.service';
import { TooManyRequestsError } from '../utils/AppError';
export class ChatRateLimitService {
  async assertCanSend(userId: string) {
    const count = await redisService.increment(`chat:rate:${userId}`, 60);
    if (count > 30) throw new TooManyRequestsError('Too many messages; please wait a moment');
  }
}
export default new ChatRateLimitService();
