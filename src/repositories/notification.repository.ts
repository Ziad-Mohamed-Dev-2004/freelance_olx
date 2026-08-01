import Notification from '../models/notification.model';
import { INotification } from '../interfaces/notification.interface';
import { BaseRepository } from './base.repository';
import { PaginationQuery } from '../types/chat.types';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }
  findForUser(user: string, query: PaginationQuery) {
    return this.findManyWithPagination({ user }, { ...query, sort: 'createdAt:desc' });
  }
  markRead(id: string, user: string) {
    return Notification.findOneAndUpdate({ _id: id, user }, { isRead: true }, { new: true }).exec();
  }
  markAllRead(user: string) {
    return Notification.updateMany({ user, isRead: false }, { isRead: true }).exec();
  }
  deleteForUser(id: string, user: string) {
    return Notification.findOneAndDelete({ _id: id, user }).exec();
  }
}
export default new NotificationRepository();
