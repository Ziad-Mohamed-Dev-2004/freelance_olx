import areaRepository, { IAreaRepository } from '../repositories/area.repository';
import cityRepository, { ICityRepository } from '../repositories/city.repository';
import { IArea } from '../interfaces/area.interface';
import { CreateAreaInput, UpdateAreaInput, AreaQueryFilters } from '../types/area.types';
import { IPaginatedResult } from '../types/common.types';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import { slugify } from '../utils/slugify';

export class AreaService {
  private readonly areaRepo: IAreaRepository;
  private readonly cityRepo: ICityRepository;

  constructor(
    areaRepo: IAreaRepository = areaRepository,
    cityRepo: ICityRepository = cityRepository,
  ) {
    this.areaRepo = areaRepo;
    this.cityRepo = cityRepo;
  }

  private async generateUniqueSlug(name: string, currentId?: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;

    while (await this.areaRepo.checkSlugExists(slug, currentId)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }

  async createArea(input: CreateAreaInput): Promise<IArea> {
    const city = await this.cityRepo.findById(input.city);
    if (!city || city.isDeleted) {
      throw new BadRequestError('City does not exist or has been deleted');
    }

    const slug = await this.generateUniqueSlug(input.name);

    const areaData: Partial<IArea> = {
      city: input.city as any,
      name: input.name,
      slug,
      latitude: input.latitude,
      longitude: input.longitude,
      isActive: input.isActive ?? true,
      isDeleted: false,
    };

    const created = await this.areaRepo.create(areaData);
    return (await this.areaRepo.findById((created._id as any).toString(), 'city')) || created;
  }

  async getAreas(filters: AreaQueryFilters): Promise<IPaginatedResult<IArea>> {
    return this.areaRepo.findAreasWithFilters(filters);
  }

  async getAreaById(id: string): Promise<IArea> {
    const area = await this.areaRepo.findById(id, 'city');
    if (!area || area.isDeleted) {
      throw new NotFoundError('Area not found');
    }
    return area;
  }

  async updateArea(id: string, input: UpdateAreaInput): Promise<IArea> {
    const area = await this.areaRepo.findById(id);
    if (!area || area.isDeleted) {
      throw new NotFoundError('Area not found');
    }

    const updateData: Partial<IArea> = {};

    if (input.city !== undefined) {
      const city = await this.cityRepo.findById(input.city);
      if (!city || city.isDeleted) {
        throw new BadRequestError('City does not exist or has been deleted');
      }
      updateData.city = input.city as any;
    }

    if (input.name !== undefined) {
      updateData.name = input.name;
      if (input.name !== area.name) {
        updateData.slug = await this.generateUniqueSlug(input.name, id);
      }
    }

    if (input.latitude !== undefined) updateData.latitude = input.latitude;
    if (input.longitude !== undefined) updateData.longitude = input.longitude;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updatedArea = await this.areaRepo.updateById(id, updateData);
    if (!updatedArea) {
      throw new NotFoundError('Area not found');
    }

    return (await this.areaRepo.findById(id, 'city')) || updatedArea;
  }

  async deleteArea(id: string): Promise<IArea> {
    const area = await this.areaRepo.findById(id);
    if (!area || area.isDeleted) {
      throw new NotFoundError('Area not found');
    }

    const deleted = await this.areaRepo.softDeleteById(id);
    if (!deleted) {
      throw new NotFoundError('Area not found');
    }
    return deleted;
  }

  async restoreArea(id: string): Promise<IArea> {
    const area = await this.areaRepo.findById(id);
    if (!area) {
      throw new NotFoundError('Area not found');
    }

    if (!area.isDeleted) {
      throw new BadRequestError('Area is not deleted');
    }

    const restored = await this.areaRepo.restoreById(id);
    if (!restored) {
      throw new NotFoundError('Area not found');
    }
    return (await this.areaRepo.findById(id, 'city')) || restored;
  }
}

export default new AreaService();
