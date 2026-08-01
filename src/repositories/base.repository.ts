import { Model, Document, PopulateOptions } from 'mongoose';
import { IPaginationOptions, IPaginatedResult } from '../types/common.types';

export interface IBaseRepository<T extends Document> {
  create(data: Partial<T>): Promise<T>;
  findById(
    id: string,
    populate?: string | PopulateOptions | (string | PopulateOptions)[],
  ): Promise<T | null>;
  findOne(
    filter: Record<string, any>,
    populate?: string | PopulateOptions | (string | PopulateOptions)[],
  ): Promise<T | null>;
  findManyWithPagination(
    filter: Record<string, any>,
    options: IPaginationOptions,
    populate?: string | PopulateOptions | (string | PopulateOptions)[],
  ): Promise<IPaginatedResult<T>>;
  updateById(id: string, data: Record<string, any>): Promise<T | null>;
  softDeleteById(id: string): Promise<T | null>;
  restoreById(id: string): Promise<T | null>;
  exists(filter: Record<string, any>): Promise<boolean>;
}

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async findById(
    id: string,
    populate?: string | PopulateOptions | (string | PopulateOptions)[],
  ): Promise<T | null> {
    const query = this.model.findById(id);
    if (populate) {
      query.populate(populate as any);
    }
    return query.exec();
  }

  async findOne(
    filter: Record<string, any>,
    populate?: string | PopulateOptions | (string | PopulateOptions)[],
  ): Promise<T | null> {
    const query = this.model.findOne(filter as any);
    if (populate) {
      query.populate(populate as any);
    }
    return query.exec();
  }

  async findManyWithPagination(
    filter: Record<string, any>,
    options: IPaginationOptions,
    populate?: string | PopulateOptions | (string | PopulateOptions)[],
  ): Promise<IPaginatedResult<T>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    const sortOption: Record<string, 1 | -1> = {};
    if (options.sort) {
      const [field, order] = options.sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOption.createdAt = -1;
    }

    const query = this.model
      .find(filter as any)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    if (populate) {
      query.populate(populate as any);
    }

    const [items, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter as any),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateById(id: string, data: Record<string, any>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data as any, { new: true, runValidators: true }).exec();
  }

  async softDeleteById(id: string): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, { isDeleted: true, isActive: false } as any, { new: true })
      .exec();
  }

  async restoreById(id: string): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, { isDeleted: false, isActive: true } as any, { new: true })
      .exec();
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    const count = await this.model.countDocuments(filter as any);
    return count > 0;
  }
}
