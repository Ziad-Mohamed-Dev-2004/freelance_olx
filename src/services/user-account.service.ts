import Otp from '../models/otp.model';
import Token from '../models/token.model';
import userRepository, { UserRepository } from '../repositories/user.repository';
import { BadRequestError, NotFoundError } from '../utils/AppError';

export class UserAccountService {
  constructor(private readonly userRepo: UserRepository = userRepository) {}

  async softDelete(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User not found');
    if (user.isDeleted) throw new BadRequestError('User is already deleted');

    const deletedUser = await this.userRepo.softDelete(id);
    if (!deletedUser) throw new NotFoundError('User not found');

    await Promise.all([Token.deleteMany({ user: id }), Otp.deleteMany({ user: id })]);

    return deletedUser;
  }
}

export default new UserAccountService();
