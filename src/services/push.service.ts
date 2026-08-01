import admin from 'firebase-admin';
import { config } from '../config/env.config';
import logger from '../utils/logger';
import deviceTokenService from './device-token.service';

/** FCM adapter. Device tokens are intentionally supplied by the caller so token storage can evolve independently. */
export class PushService {
  private initialized = false;
  private initialize() {
    if (
      this.initialized ||
      !config.firebase.projectId ||
      !config.firebase.clientEmail ||
      !config.firebase.privateKey
    )
      return false;
    if (!admin.apps.length)
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
        }),
      });
    this.initialized = true;
    return true;
  }
  async send(tokens: string[], title: string, body: string, data: Record<string, string> = {}) {
    if (!tokens.length || !this.initialize()) return;
    try {
      await admin.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data });
    } catch (error) {
      logger.warn(`FCM push failed: ${(error as Error).message}`);
    }
  }
  async sendToUser(userId: string, title: string, body: string, data: Record<string, string> = {}) {
    await this.send(await deviceTokenService.tokensForUser(userId), title, body, data);
  }
}
export default new PushService();
