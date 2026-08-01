import cityRepository, { ICityRepository } from '../repositories/city.repository';
import { ICity } from '../interfaces/city.interface';
import { CreateCityInput, UpdateCityInput, CityQueryFilters } from '../types/city.types';
import { IPaginatedResult } from '../types/common.types';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/AppError';
import { slugify } from '../utils/slugify';

export class CityService {
  private readonly cityRepo: ICityRepository;

  constructor(repo: ICityRepository = cityRepository) {
    this.cityRepo = repo;
  }

  private async generateUniqueSlug(name: string, currentId?: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;

    while (await this.cityRepo.checkSlugExists(slug, currentId)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }

  async createCity(input: CreateCityInput): Promise<ICity> {
    const nameExists = await this.cityRepo.checkNameExists(input.name);
    if (nameExists) {
      throw new ConflictError('A city with this name already exists');
    }

    const slug = await this.generateUniqueSlug(input.name);

    const cityData: Partial<ICity> = {
      name: input.name,
      slug,
      governorate: input.governorate,
      latitude: input.latitude,
      longitude: input.longitude,
      isActive: input.isActive ?? true,
      isDeleted: false,
    };

    return this.cityRepo.create(cityData);
  }

  async getCities(filters: CityQueryFilters): Promise<IPaginatedResult<ICity>> {
    return this.cityRepo.findCitiesWithFilters(filters);
  }

  async getCityById(id: string): Promise<ICity> {
    const city = await this.cityRepo.findById(id);
    if (!city || city.isDeleted) {
      throw new NotFoundError('City not found');
    }
    return city;
  }

  async updateCity(id: string, input: UpdateCityInput): Promise<ICity> {
    const city = await this.cityRepo.findById(id);
    if (!city || city.isDeleted) {
      throw new NotFoundError('City not found');
    }

    const updateData: Partial<ICity> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
      if (input.name !== city.name) {
        const nameExists = await this.cityRepo.checkNameExists(input.name, id);
        if (nameExists) {
          throw new ConflictError('A city with this name already exists');
        }
        updateData.slug = await this.generateUniqueSlug(input.name, id);
      }
    }

    if (input.governorate !== undefined) updateData.governorate = input.governorate;
    if (input.latitude !== undefined) updateData.latitude = input.latitude;
    if (input.longitude !== undefined) updateData.longitude = input.longitude;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updatedCity = await this.cityRepo.updateById(id, updateData);
    if (!updatedCity) {
      throw new NotFoundError('City not found');
    }

    return updatedCity;
  }

  async deleteCity(id: string): Promise<ICity> {
    const city = await this.cityRepo.findById(id);
    if (!city || city.isDeleted) {
      throw new NotFoundError('City not found');
    }

    const deleted = await this.cityRepo.softDeleteById(id);
    if (!deleted) {
      throw new NotFoundError('City not found');
    }
    return deleted;
  }

  async restoreCity(id: string): Promise<ICity> {
    const city = await this.cityRepo.findById(id);
    if (!city) {
      throw new NotFoundError('City not found');
    }

    if (!city.isDeleted) {
      throw new BadRequestError('City is not deleted');
    }

    const restored = await this.cityRepo.restoreById(id);
    if (!restored) {
      throw new NotFoundError('City not found');
    }
    return restored;
  }
}

export default new CityService();
