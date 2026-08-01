import notificationRepository, {
  NotificationRepository,
} from '../repositories/notification.repository';
import { INotification, NotificationType } from '../interfaces/notification.interface';
import { PaginationQuery } from '../types/chat.types';
import { NotFoundError } from '../utils/AppError';
import pushService from './push.service';

export class NotificationService {
  constructor(private readonly repo: NotificationRepository = notificationRepository) {}
  create(
    user: string,
    data: Pick<INotification, 'title' | 'body' | 'type'> &
      Partial<Pick<INotification, 'link' | 'metadata'>>,
  ) {
    return this.repo.create({
      user: user as any,
      ...data,
      metadata: data.metadata || {},
    } as Partial<INotification>);
  }
  getForUser(user: string, query: PaginationQuery) {
    return this.repo.findForUser(user, query);
  }
  async markRead(id: string, user: string) {
    const notification = await this.repo.markRead(id, user);
    if (!notification) throw new NotFoundError('Notification not found');
    return notification;
  }
  markAllRead(user: string) {
    return this.repo.markAllRead(user);
  }
  async remove(id: string, user: string) {
    if (!(await this.repo.deleteForUser(id, user)))
      throw new NotFoundError('Notification not found');
  }
  async newMessage(
    user: string,
    senderName: string,
    conversationId: string,
    messagePreview: string,
  ) {
    const title = `New message from ${senderName}`;
    const body = messagePreview || 'Sent an attachment';
    const notification = await this.create(user, {
      title,
      body,
      type: NotificationType.NEW_MESSAGE,
      link: `/conversations/${conversationId}`,
      metadata: { conversationId },
    });
    await pushService.sendToUser(user, title, body, {
      type: NotificationType.NEW_MESSAGE,
      conversationId,
    });
    return notification;
  }
  async propertyStatus(user: string, propertyId: string, approved: boolean) {
    const type = approved ? NotificationType.PROPERTY_APPROVED : NotificationType.PROPERTY_REJECTED;
    const title = approved ? 'Property approved' : 'Property rejected';
    const body = approved ? 'Your property has been approved.' : 'Your property has been rejected.';
    const notification = await this.create(user, {
      title,
      body,
      type,
      link: `/properties/${propertyId}`,
      metadata: { propertyId },
    });
    await pushService.sendToUser(user, title, body, { type, propertyId });
    return notification;
  }
  reportUpdated(user: string, reportId: string, body: string) {
    return this.create(user, {
      title: 'Report update',
      body,
      type: NotificationType.REPORT_UPDATE,
      link: `/reports/${reportId}`,
      metadata: { reportId },
    });
  }
}
export default new NotificationService();
