import propertyRepository, {
  IPropertyRepository,
  populateProperty,
} from '../repositories/property.repository';
import categoryRepository from '../repositories/category.repository';
import cityRepository from '../repositories/city.repository';
import areaRepository from '../repositories/area.repository';
import { IProperty, PropertyStatus } from '../interfaces/property.interface';
import {
  CreatePropertyInput,
  PropertyPaginatedResult,
  PropertyQueryFilters,
  UpdatePropertyInput,
} from '../types/property.types';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import cloudinaryService from './cloudinary.service';
import redisService from './redis.service';
import { config } from '../config/env.config';

export class PropertyService {
  constructor(private readonly propertyRepo: IPropertyRepository = propertyRepository) {}

  private async validateLocation(
    input: Pick<CreatePropertyInput, 'category' | 'city' | 'area'>,
  ): Promise<void> {
    const [category, city, area] = await Promise.all([
      categoryRepository.findById(input.category),
      cityRepository.findById(input.city),
      areaRepository.findById(input.area),
    ]);
    if (!category || category.isDeleted || !category.isActive)
      throw new BadRequestError('Category does not exist or is inactive');
    if (!city || city.isDeleted || !city.isActive)
      throw new BadRequestError('City does not exist or is inactive');
    if (!area || area.isDeleted || !area.isActive || area.city.toString() !== input.city) {
      throw new BadRequestError(
        'Area does not exist, is inactive, or does not belong to the selected city',
      );
    }
  }

  private ensureOwner(property: IProperty, userId: string, isAdmin: boolean): void {
    if (!isAdmin && property.owner.toString() !== userId)
      throw new ForbiddenError('You do not have permission to modify this property');
  }

  async createProperty(
    ownerId: string,
    input: CreatePropertyInput,
    files: Express.Multer.File[] = [],
  ): Promise<IProperty> {
    await this.validateLocation(input);
    const images = await Promise.all(
      files.map((file) => cloudinaryService.uploadImage(file, 'properties')),
    );
    try {
      const property = await this.propertyRepo.create({
        ...input,
        owner: ownerId as any,
        images: images.map((image) => image.url),
        currency: input.currency?.toUpperCase() ?? 'EGP',
        status: PropertyStatus.PENDING,
        isDeleted: false,
      } as unknown as Partial<IProperty>);
      return (
        (await this.propertyRepo.findById(property._id.toString(), populateProperty)) || property
      );
    } catch (error) {
      await Promise.all(images.map((image) => cloudinaryService.deleteImage(image.url)));
      throw error;
    }
  }

  async getPropertyById(id: string, viewerKey: string): Promise<IProperty> {
    const property = await this.propertyRepo.findById(id, populateProperty);
    if (!property || property.isDeleted) throw new NotFoundError('Property not found');
    const cacheKey = `property:view:${id}:${viewerKey}`;
    if (await redisService.setIfAbsent(cacheKey, config.redis.propertyViewTtlSeconds)) {
      return (await this.propertyRepo.recordView(id)) || property;
    }
    return property;
  }

  async getProperties(
    filters: PropertyQueryFilters,
    isAdmin = false,
  ): Promise<PropertyPaginatedResult> {
    if (!isAdmin && filters.status && filters.status !== PropertyStatus.ACTIVE) {
      throw new ForbiddenError('Only administrators can view non-active properties');
    }
    return this.propertyRepo.findPropertiesWithFilters({
      ...filters,
      status: isAdmin ? filters.status : PropertyStatus.ACTIVE,
    });
  }
  async getMyProperties(
    owner: string,
    filters: PropertyQueryFilters,
  ): Promise<PropertyPaginatedResult> {
    return this.propertyRepo.findPropertiesWithFilters({ ...filters, owner });
  }

  async updateProperty(
    id: string,
    userId: string,
    isAdmin: boolean,
    input: UpdatePropertyInput,
    files: Express.Multer.File[] = [],
  ): Promise<IProperty> {
    const property = await this.propertyRepo.findById(id);
    if (!property || property.isDeleted) throw new NotFoundError('Property not found');
    this.ensureOwner(property, userId, isAdmin);
    const locationChanged =
      input.category !== undefined || input.city !== undefined || input.area !== undefined;
    if (locationChanged)
      await this.validateLocation({
        category: input.category ?? property.category.toString(),
        city: input.city ?? property.city.toString(),
        area: input.area ?? property.area.toString(),
      });
    const newImages = await Promise.all(
      files.map((file) => cloudinaryService.uploadImage(file, 'properties')),
    );
    const update: Record<string, any> = { ...input };
    if (input.currency) update.currency = input.currency.toUpperCase();
    if (files.length) update.images = newImages.map((image) => image.url);
    try {
      const updated = await this.propertyRepo.updateById(id, update);
      if (!updated) throw new NotFoundError('Property not found');
      if (files.length)
        await Promise.all(property.images.map((url) => cloudinaryService.deleteImage(url)));
      return (await this.propertyRepo.findById(id, populateProperty)) || updated;
    } catch (error) {
      await Promise.all(newImages.map((image) => cloudinaryService.deleteImage(image.url)));
      throw error;
    }
  }

  async addImages(
    id: string,
    userId: string,
    isAdmin: boolean,
    files: Express.Multer.File[],
  ): Promise<IProperty> {
    const property = await this.propertyRepo.findById(id);
    if (!property || property.isDeleted) throw new NotFoundError('Property not found');
    this.ensureOwner(property, userId, isAdmin);
    if (!files.length) throw new BadRequestError('At least one image is required');
    if (property.images.length + files.length > 10) {
      throw new BadRequestError('A property can contain a maximum of 10 images');
    }
    const uploaded = await Promise.all(
      files.map((file) => cloudinaryService.uploadImage(file, 'properties')),
    );
    try {
      const updated = await this.propertyRepo.updateById(id, {
        images: [...property.images, ...uploaded.map((image) => image.url)],
      });
      if (!updated) throw new NotFoundError('Property not found');
      return (await this.propertyRepo.findById(id, populateProperty)) || updated;
    } catch (error) {
      await Promise.all(uploaded.map((image) => cloudinaryService.deleteImage(image.url)));
      throw error;
    }
  }

  async deleteImage(
    id: string,
    imageIndex: number,
    userId: string,
    isAdmin: boolean,
  ): Promise<IProperty> {
    const property = await this.propertyRepo.findById(id);
    if (!property || property.isDeleted) throw new NotFoundError('Property not found');
    this.ensureOwner(property, userId, isAdmin);
    const image = property.images[imageIndex];
    if (!image) throw new NotFoundError('Property image not found');
    const images = property.images.filter((_, index) => index !== imageIndex);
    const updated = await this.propertyRepo.updateById(id, { images });
    if (!updated) throw new NotFoundError('Property not found');
    await cloudinaryService.deleteImage(image);
    return (await this.propertyRepo.findById(id, populateProperty)) || updated;
  }

  async deleteProperty(id: string, userId: string, isAdmin: boolean): Promise<IProperty> {
    const property = await this.propertyRepo.findById(id);
    if (!property || property.isDeleted) throw new NotFoundError('Property not found');
    this.ensureOwner(property, userId, isAdmin);
    const deleted = await this.propertyRepo.updateById(id, {
      isDeleted: true,
      status: PropertyStatus.ARCHIVED,
    });
    if (!deleted) throw new NotFoundError('Property not found');
    return deleted;
  }

  async restoreProperty(id: string): Promise<IProperty> {
    const property = await this.propertyRepo.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    if (!property.isDeleted) throw new BadRequestError('Property is not deleted');
    const restored = await this.propertyRepo.updateById(id, {
      isDeleted: false,
      status: PropertyStatus.PENDING,
    });
    if (!restored) throw new NotFoundError('Property not found');
    return restored;
  }

  async changeStatus(
    id: string,
    userId: string,
    isAdmin: boolean,
    status: PropertyStatus,
  ): Promise<IProperty> {
    const property = await this.propertyRepo.findById(id);
    if (!property || property.isDeleted) throw new NotFoundError('Property not found');
    if (status === PropertyStatus.RENTED || status === PropertyStatus.ARCHIVED) {
      this.ensureOwner(property, userId, isAdmin);
    }
    if (property.status === status) throw new BadRequestError(`Property is already ${status}`);
    if (
      status === PropertyStatus.ACTIVE &&
      ![PropertyStatus.PENDING, PropertyStatus.REJECTED].includes(property.status)
    ) {
      throw new BadRequestError('Only pending or rejected properties can be approved');
    }
    if (status === PropertyStatus.REJECTED && property.status !== PropertyStatus.PENDING) {
      throw new BadRequestError('Only pending properties can be rejected');
    }
    if (status === PropertyStatus.RENTED && property.status !== PropertyStatus.ACTIVE) {
      throw new BadRequestError('Only active properties can be marked as rented');
    }
    const data: Record<string, any> = { status };
    if (status === PropertyStatus.ACTIVE && !property.publishedAt) data.publishedAt = new Date();
    const updated = await this.propertyRepo.updateById(id, data);
    if (!updated) throw new NotFoundError('Property not found');
    return updated;
  }
}

export default new PropertyService();
