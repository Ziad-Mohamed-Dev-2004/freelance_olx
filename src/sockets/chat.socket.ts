import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';
import User from '../models/user.model';
import conversationService from '../services/conversation.service';
import messageService from '../services/message.service';
import presenceService from '../services/presence.service';
import typingService from '../services/typing.service';
import { MessageType } from '../interfaces/message.interface';
import logger from '../utils/logger';
import deviceTokenService from '../services/device-token.service';
import chatRateLimitService from '../services/chat-rate-limit.service';

interface AuthSocket extends Socket {
  data: { userId: string; joined: Set<string> };
}
const userRoom = (id: string) => `user:${id}`;
const conversationRoom = (id: string) => `conversation:${id}`;
const asString = (value: unknown) => (typeof value === 'string' ? value : '');
export const initializeChatSocket = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
      const payload = jwt.verify(asString(token), config.jwt.secret) as { sub: string };
      if (!(await User.exists({ _id: payload.sub }))) return next(new Error('Unauthorized'));
      (socket as AuthSocket).data = { userId: payload.sub, joined: new Set() };
      await deviceTokenService.register(
        payload.sub,
        asString(socket.handshake.auth?.fcmToken),
        socket.handshake.auth?.platform,
      );
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });
  io.on('connection', async (rawSocket) => {
    const socket = rawSocket as AuthSocket;
    const userId = socket.data.userId;
    socket.join(userRoom(userId));
    await presenceService.connect(userId, socket.id);
    socket.broadcast.emit('userOnline', { userId });
    const access = async (conversationId: unknown) => {
      const id = asString(conversationId);
      await conversationService.assertAccess(id, userId);
      return id;
    };
    socket.on('joinConversation', async ({ conversationId }, ack = () => undefined) => {
      try {
        const id = await access(conversationId);
        socket.join(conversationRoom(id));
        socket.data.joined.add(id);
        await messageService.delivered(id, userId);
        socket.to(conversationRoom(id)).emit('messageDelivered', { conversationId: id, userId });
        ack({ ok: true });
      } catch (error) {
        ack({ ok: false, error: (error as Error).message });
      }
    });
    socket.on('leaveConversation', async ({ conversationId }, ack = () => undefined) => {
      try {
        const id = await access(conversationId);
        socket.leave(conversationRoom(id));
        socket.data.joined.delete(id);
        await typingService.stop(id, userId);
        socket.to(conversationRoom(id)).emit('stopTyping', { conversationId: id, userId });
        ack({ ok: true });
      } catch (error) {
        ack({ ok: false, error: (error as Error).message });
      }
    });
    socket.on('sendMessage', async (payload, ack = () => undefined) => {
      try {
        await chatRateLimitService.assertCanSend(userId);
        const id = await access(payload?.conversationId);
        const result = await messageService.send(id, userId, {
          type: payload?.type || MessageType.TEXT,
          text: payload?.text,
          attachment: payload?.attachment,
        });
        io.to(conversationRoom(id)).emit('receiveMessage', result.message);
        io.to(userRoom(result.receiverId)).emit('receiveMessage', result.message);
        ack({ ok: true, data: result.message });
      } catch (error) {
        ack({ ok: false, error: (error as Error).message });
      }
    });
    socket.on('typing', async ({ conversationId }) => {
      try {
        const id = await access(conversationId);
        await typingService.start(id, userId);
        socket.to(conversationRoom(id)).emit('typing', { conversationId: id, userId });
      } catch {
        /* silently ignore unauthorized ephemeral events */
      }
    });
    socket.on('stopTyping', async ({ conversationId }) => {
      try {
        const id = await access(conversationId);
        await typingService.stop(id, userId);
        socket.to(conversationRoom(id)).emit('stopTyping', { conversationId: id, userId });
      } catch {
        /* silently ignore */
      }
    });
    socket.on('messageSeen', async ({ conversationId }, ack = () => undefined) => {
      try {
        const id = await access(conversationId);
        const recipients = await messageService.seen(id, userId);
        recipients.forEach((recipient) =>
          io.to(userRoom(recipient)).emit('messageSeen', { conversationId: id, userId }),
        );
        ack({ ok: true });
      } catch (error) {
        ack({ ok: false, error: (error as Error).message });
      }
    });
    socket.on('messageDelivered', async ({ conversationId }, ack = () => undefined) => {
      try {
        const id = await access(conversationId);
        await messageService.delivered(id, userId);
        socket.to(conversationRoom(id)).emit('messageDelivered', { conversationId: id, userId });
        ack({ ok: true });
      } catch (error) {
        ack({ ok: false, error: (error as Error).message });
      }
    });
    socket.on('deleteMessage', async ({ conversationId, messageId }, ack = () => undefined) => {
      try {
        const id = await access(conversationId);
        const result = await messageService.remove(id, asString(messageId), userId);
        io.to(conversationRoom(id)).emit('messageDeleted', result);
        ack({ ok: true, data: result });
      } catch (error) {
        ack({ ok: false, error: (error as Error).message });
      }
    });
    socket.on('disconnect', async () => {
      await Promise.all([...socket.data.joined].map((id) => typingService.stop(id, userId)));
      await presenceService.disconnect(userId, socket.id);
      if (!(await presenceService.isOnline(userId)))
        socket.broadcast.emit('userOffline', { userId });
    });
  });
  io.engine.on('connection_error', (error) =>
    logger.warn(`Socket connection error: ${error.message}`),
  );
};
