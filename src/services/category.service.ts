import categoryRepository, { ICategoryRepository } from '../repositories/category.repository';
import { ICategory } from '../interfaces/category.interface';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryFilters,
} from '../types/category.types';
import { IPaginatedResult } from '../types/common.types';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import { slugify } from '../utils/slugify';
import cloudinaryService from './cloudinary.service';

export class CategoryService {
  private readonly categoryRepo: ICategoryRepository;

  constructor(repo: ICategoryRepository = categoryRepository) {
    this.categoryRepo = repo;
  }

  private async generateUniqueSlug(name: string, currentId?: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;

    while (await this.categoryRepo.checkSlugExists(slug, currentId)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }

  async createCategory(input: CreateCategoryInput): Promise<ICategory> {
    const slug = await this.generateUniqueSlug(input.name);

    if (input.parentCategory) {
      const parent = await this.categoryRepo.findById(input.parentCategory);
      if (!parent || parent.isDeleted) {
        throw new BadRequestError('Parent category does not exist or has been deleted');
      }
    }

    const categoryData: Partial<ICategory> = {
      name: input.name,
      slug,
      icon: input.icon ?? '',
      image: input.image ?? '',
      parentCategory: input.parentCategory ? (input.parentCategory as any) : null,
      isActive: input.isActive ?? true,
      isDeleted: false,
    };

    return this.categoryRepo.create(categoryData);
  }

  async getCategories(filters: CategoryQueryFilters): Promise<IPaginatedResult<ICategory>> {
    return this.categoryRepo.findCategoriesWithFilters(filters);
  }

  async getCategoryById(id: string): Promise<ICategory> {
    const category = await this.categoryRepo.findById(id, 'parentCategory');
    if (!category || category.isDeleted) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<ICategory> {
    const category = await this.categoryRepo.findById(id);
    if (!category || category.isDeleted) {
      throw new NotFoundError('Category not found');
    }

    const updateData: Partial<ICategory> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
      if (input.name !== category.name) {
        updateData.slug = await this.generateUniqueSlug(input.name, id);
      }
    }

    if (input.icon !== undefined) updateData.icon = input.icon;

    if (input.image !== undefined) {
      if (input.image !== category.image && category.image) {
        await cloudinaryService.deleteImage(category.image);
      }
      updateData.image = input.image;
    }

    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    if (input.parentCategory !== undefined) {
      if (input.parentCategory === id) {
        throw new BadRequestError('A category cannot be its own parent');
      }
      if (input.parentCategory) {
        const parent = await this.categoryRepo.findById(input.parentCategory);
        if (!parent || parent.isDeleted) {
          throw new BadRequestError('Parent category does not exist or has been deleted');
        }
        updateData.parentCategory = input.parentCategory as any;
      } else {
        updateData.parentCategory = null;
      }
    }

    const updatedCategory = await this.categoryRepo.updateById(id, updateData);
    if (!updatedCategory) {
      throw new NotFoundError('Category not found');
    }

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<ICategory> {
    const category = await this.categoryRepo.findById(id);
    if (!category || category.isDeleted) {
      throw new NotFoundError('Category not found');
    }

    const deleted = await this.categoryRepo.softDeleteById(id);
    if (!deleted) {
      throw new NotFoundError('Category not found');
    }
    return deleted;
  }

  async restoreCategory(id: string): Promise<ICategory> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (!category.isDeleted) {
      throw new BadRequestError('Category is not deleted');
    }

    const restored = await this.categoryRepo.restoreById(id);
    if (!restored) {
      throw new NotFoundError('Category not found');
    }
    return restored;
  }
}

export default new CategoryService();
