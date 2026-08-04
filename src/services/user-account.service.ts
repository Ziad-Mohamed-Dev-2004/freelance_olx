import Block from '../models/block.model';
import Conversation from '../models/conversation.model';
import DeviceToken from '../models/device-token.model';
import Favorite from '../models/favorite.model';
import Message from '../models/message.model';
import Notification from '../models/notification.model';
import Otp from '../models/otp.model';
import Property from '../models/property.model';
import PropertyView from '../models/property-view.model';
import Report from '../models/report.model';
import Token from '../models/token.model';
import { PropertyShare, RecentlyViewed, Review, SavedSearch } from '../models/property-engagement.model';
import userRepository, { UserRepository } from '../repositories/user.repository';
import { NotFoundError } from '../utils/AppError';
import cloudinaryService from './cloudinary.service';

export class UserAccountService {
  constructor(private readonly userRepo: UserRepository = userRepository) {}

  async hardDelete(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User not found');
    const ownedProperties = await Property.find({ owner: id }).select('_id images').lean();
    const propertyIds = ownedProperties.map((property) => property._id);
    const propertyImages = ownedProperties.flatMap((property) => property.images ?? []);

    const conversationFilter = propertyIds.length
      ? { $or: [{ participants: id }, { property: { $in: propertyIds } }] }
      : { participants: id };
    const conversations = await Conversation.find(conversationFilter).select('_id').lean();
    const conversationIds = conversations.map((conversation) => conversation._id);

    const propertyScopedFilters = propertyIds.length ? [{ property: { $in: propertyIds } }] : [];
    const reportedPropertyFilter = propertyIds.length
      ? [{ reportedProperty: { $in: propertyIds } }]
      : [];
    const conversationScopedFilters = conversationIds.length
      ? [{ conversation: { $in: conversationIds } }]
      : [];

    const cleanupTasks: Promise<unknown>[] = [
      Token.deleteMany({ user: id }),
      Otp.deleteMany({ user: id }),
      DeviceToken.deleteMany({ user: id }),
      Notification.deleteMany({ user: id }),
      Block.deleteMany({ $or: [{ user: id }, { blockedUser: id }] }),
      Favorite.deleteMany({ $or: [{ user: id }, ...propertyScopedFilters] }),
      Review.deleteMany({ $or: [{ user: id }, ...propertyScopedFilters] }),
      SavedSearch.deleteMany({ user: id }),
      RecentlyViewed.deleteMany({ $or: [{ user: id }, ...propertyScopedFilters] }),
      PropertyShare.deleteMany({ $or: [{ user: id }, ...propertyScopedFilters] }),
      Report.deleteMany({
        $or: [{ reporter: id }, { reportedUser: id }, ...reportedPropertyFilter],
      }),
      Report.updateMany({ resolvedBy: id }, { $set: { resolvedBy: null, resolvedAt: null } }),
      Message.deleteMany({ $or: [{ sender: id }, ...conversationScopedFilters] }),
    ];

    if (propertyIds.length) {
      cleanupTasks.push(
        PropertyView.deleteMany({ property: { $in: propertyIds } }),
        Property.deleteMany({ _id: { $in: propertyIds } }),
      );
    }
    if (conversationIds.length) {
      cleanupTasks.push(Conversation.deleteMany({ _id: { $in: conversationIds } }));
    }
    if (user.avatar) {
      cleanupTasks.push(cloudinaryService.deleteImage(user.avatar));
    }
    cleanupTasks.push(...propertyImages.map((imageUrl) => cloudinaryService.deleteImage(imageUrl)));

    await Promise.all(cleanupTasks);
    await this.userRepo.hardDelete(id);

    return { id };
  }
}

export default new UserAccountService();
