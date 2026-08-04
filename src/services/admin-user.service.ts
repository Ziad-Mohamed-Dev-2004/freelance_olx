import userRepository, { UserRepository } from '../repositories/user.repository';
import adminRepository, { AdminRepository } from '../repositories/admin.repository';
import userAccountService from './user-account.service';
import {
  AdminUserQuery,
  ChangeUserRoleInput,
  ResetUserPasswordInput,
  UpdateAdminUserInput,
} from '../types/admin.types';
import { UserRole, UserStatus } from '../interfaces/user.interface';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/AppError';

export class AdminUserService {
  constructor(
    private readonly userRepo: UserRepository = userRepository,
    private readonly adminRepo: AdminRepository = adminRepository,
  ) {}

  getAll(query: AdminUserQuery) {
    return this.userRepo.findWithFilters(query);
  }

  async getById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User not found');
    const stats = await this.adminRepo.getUserStats(id);
    return { user, stats };
  }

  async update(id: string, input: UpdateAdminUserInput, adminId: string) {
    const user = await this.ensureUserExists(id);
    this.ensureNotDeleted(user);
    this.preventSelfAction(adminId, id, 'update your own account through this endpoint');

    if (input.email) {
      const existing = await this.userRepo.findByEmail(input.email, id);
      if (existing) throw new ConflictError('Email address is already in use');
    }

    const updated = await this.userRepo.updateById(id, input);
    if (!updated) throw new NotFoundError('User not found');
    return updated;
  }

  async block(id: string, adminId: string) {
    const user = await this.ensureUserExists(id);
    this.ensureNotDeleted(user);
    this.preventSelfAction(adminId, id, 'block your own account');
    await this.ensureNotAdmin(id);
    return this.changeStatus(id, UserStatus.BLOCKED, UserStatus.BLOCKED, 'User is already blocked');
  }

  async unblock(id: string, adminId: string) {
    const user = await this.ensureUserExists(id);
    this.ensureNotDeleted(user);
    this.preventSelfAction(adminId, id, 'unblock your own account');
    return this.changeStatus(id, UserStatus.ACTIVE, UserStatus.BLOCKED, 'User is not blocked');
  }

  async suspend(id: string, adminId: string) {
    const user = await this.ensureUserExists(id);
    this.ensureNotDeleted(user);
    this.preventSelfAction(adminId, id, 'suspend your own account');
    await this.ensureNotAdmin(id);
    return this.changeStatus(
      id,
      UserStatus.SUSPENDED,
      UserStatus.SUSPENDED,
      'User is already suspended',
    );
  }

  async activate(id: string, adminId: string) {
    const user = await this.ensureUserExists(id);
    this.ensureNotDeleted(user);
    this.preventSelfAction(adminId, id, 'activate your own account');
    return this.changeStatus(id, UserStatus.ACTIVE, UserStatus.ACTIVE, 'User is already active', [
      UserStatus.INACTIVE,
      UserStatus.BLOCKED,
      UserStatus.SUSPENDED,
    ]);
  }

  async deleteUser(id: string, adminId: string) {
    this.preventSelfAction(adminId, id, 'delete your own account');
    return userAccountService.hardDelete(id);
  }

  async restore(id: string, adminId: string) {
    const user = await this.ensureUserExists(id);
    this.preventSelfAction(adminId, id, 'restore your own account through this endpoint');
    if (!user.isDeleted) throw new BadRequestError('User is not deleted');
    const restored = await this.userRepo.restore(id);
    if (!restored) throw new NotFoundError('User not found');
    return restored;
  }

  async resetPassword(id: string, input: ResetUserPasswordInput, adminId: string) {
    const user = await this.ensureUserExists(id);
    this.ensureNotDeleted(user);
    this.preventSelfAction(adminId, id, 'reset your own password through this endpoint');
    const updated = await this.userRepo.resetPassword(id, input.password);
    if (!updated) throw new NotFoundError('User not found');
    return updated;
  }

  async changeRole(id: string, input: ChangeUserRoleInput, adminId: string) {
    const user = await this.ensureUserExists(id);
    this.ensureNotDeleted(user);
    this.preventSelfAction(adminId, id, 'change your own role');
    if (user.role === input.role) throw new BadRequestError(`User already has role ${input.role}`);
    const updated = await this.userRepo.setRole(id, input.role);
    if (!updated) throw new NotFoundError('User not found');
    return updated;
  }

  private async ensureUserExists(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  private async ensureNotAdmin(id: string) {
    const user = await this.userRepo.findById(id);
    if (user?.role === UserRole.ADMIN) {
      throw new BadRequestError('Admin accounts cannot be blocked or suspended');
    }
  }

  private ensureNotDeleted(user: { isDeleted: boolean }) {
    if (user.isDeleted) throw new BadRequestError('User is deleted; restore the account first');
  }

  private preventSelfAction(adminId: string, targetId: string, action: string) {
    if (adminId === targetId) {
      throw new BadRequestError(`You cannot ${action}`);
    }
  }

  private async changeStatus(
    id: string,
    newStatus: UserStatus,
    conflictStatus: UserStatus,
    conflictMessage: string,
    allowedFrom?: UserStatus[],
  ) {
    const user = await this.ensureUserExists(id);

    if (user.status === conflictStatus && newStatus === conflictStatus) {
      throw new BadRequestError(conflictMessage);
    }

    if (allowedFrom && !allowedFrom.includes(user.status)) {
      throw new BadRequestError(`Cannot change user status from ${user.status}`);
    }

    const updated = await this.userRepo.setStatus(id, newStatus);
    if (!updated) throw new NotFoundError('User not found');
    return updated;
  }
}

export default new AdminUserService();
