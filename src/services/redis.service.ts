import { createClient, RedisClientType } from 'redis';
import { config } from '../config/env.config';
import logger from '../utils/logger';

/**
 * Small fail-open Redis wrapper. Cache outages must never make API reads fail.
 * Connection is lazy so local development does not require Redis to start the server.
 */
export class RedisService {
  private client: RedisClientType | null = null;
  private connecting: Promise<void> | null = null;

  private async getClient(): Promise<RedisClientType | null> {
    if (this.client?.isOpen) return this.client;
    if (!this.client) {
      this.client = createClient({
        url: config.redis.url,
        socket: { connectTimeout: 1000, reconnectStrategy: false },
      });
      this.client.on('error', (error) => logger.warn(`Redis cache error: ${error.message}`));
    }
    if (!this.connecting) {
      this.connecting = this.client
        .connect()
        .then(() => undefined)
        .catch((error) => {
          logger.warn(`Redis cache unavailable: ${error.message}`);
        })
        .finally(() => {
          this.connecting = null;
        });
    }
    await this.connecting;
    return this.client.isOpen ? this.client : null;
  }

  async setIfAbsent(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return true;
      return (await client.set(key, '1', { NX: true, EX: ttlSeconds })) === 'OK';
    } catch (error) {
      logger.warn(`Redis cache operation failed: ${(error as Error).message}`);
      return true;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      const client = await this.getClient();
      if (client) await client.set(key, value, ttlSeconds ? { EX: ttlSeconds } : undefined);
    } catch (error) {
      logger.warn(`Redis cache operation failed: ${(error as Error).message}`);
    }
  }
  async delete(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      if (client) await client.del(key);
    } catch (error) {
      logger.warn(`Redis cache operation failed: ${(error as Error).message}`);
    }
  }
  async setAdd(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      const client = await this.getClient();
      if (client) {
        await client.sAdd(key, value);
        await client.expire(key, ttlSeconds);
      }
    } catch (error) {
      logger.warn(`Redis cache operation failed: ${(error as Error).message}`);
    }
  }
  async setRemove(key: string, value: string): Promise<void> {
    try {
      const client = await this.getClient();
      if (client) await client.sRem(key, value);
    } catch (error) {
      logger.warn(`Redis cache operation failed: ${(error as Error).message}`);
    }
  }
  async setMembers(key: string): Promise<string[]> {
    try {
      const client = await this.getClient();
      return client ? client.sMembers(key) : [];
    } catch {
      return [];
    }
  }
  async setSize(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return client ? client.sCard(key) : 0;
    } catch {
      return 0;
    }
  }
  async increment(key: string, ttlSeconds: number): Promise<number> {
    try {
      const client = await this.getClient();
      if (!client) return 1;
      const count = await client.incr(key);
      if (count === 1) await client.expire(key, ttlSeconds);
      return count;
    } catch {
      return 1;
    }
  }
}

export default new RedisService();
