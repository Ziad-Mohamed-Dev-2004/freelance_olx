import fs from 'fs/promises';
import path from 'path';
import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary.config';
import { config } from '../config/env.config';
import { BadRequestError, InternalServerError } from '../utils/AppError';
import logger from '../utils/logger';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export interface UploadedImageResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

export class CloudinaryService {
  validateImageFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestError('Invalid image type. Allowed: JPEG, PNG, WEBP, GIF');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestError('Image size must not exceed 5 MB');
    }
  }

  async uploadImage(file: Express.Multer.File, folder: string): Promise<UploadedImageResult> {
    this.validateImageFile(file);

    if (config.imageStorage === 'local') {
      return this.uploadLocal(file, folder);
    }

    try {
      return await this.uploadToCloudinary(file, folder);
    } catch (error) {
      if (this.shouldFallbackToLocal(error)) {
        logger.warn(
          'Cloudinary upload failed due to missing API key permissions. Falling back to local storage.',
        );
        return this.uploadLocal(file, folder);
      }

      throw this.toUploadError(error);
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (this.isLocalImageUrl(imageUrl)) {
      await this.deleteLocalImage(imageUrl);
      return;
    }

    const publicId = this.extractPublicId(imageUrl);
    if (!publicId) {
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      logger.error(`Cloudinary delete failed for publicId ${publicId}`, error);
    }
  }

  async verifyUploadAccess(): Promise<{ ok: boolean; mode: 'cloudinary' | 'local'; message?: string }> {
    if (config.imageStorage === 'local') {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      return { ok: true, mode: 'local' };
    }

    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      return {
        ok: false,
        mode: 'cloudinary',
        message: 'Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      };
    }

    try {
      await cloudinary.api.ping();
    } catch (error) {
      return {
        ok: false,
        mode: 'cloudinary',
        message: `Cloudinary credentials are invalid: ${this.getErrorMessage(error)}`,
      };
    }

    try {
      const tinyPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );
      const result = await this.uploadBufferToCloudinary(
        tinyPng,
        'health-check',
        'health-check.png',
        'image/png',
      );
      await cloudinary.uploader.destroy(result.public_id);
      return { ok: true, mode: 'cloudinary' };
    } catch (error) {
      if (config.cloudinary.uploadPreset) {
        return {
          ok: false,
          mode: 'cloudinary',
          message: `Cloudinary upload preset "${config.cloudinary.uploadPreset}" failed: ${this.getErrorMessage(error)}`,
        };
      }

      if (this.isCloudinaryPermissionError(error)) {
        return {
          ok: false,
          mode: 'cloudinary',
          message:
            'Cloudinary API key is missing upload permissions. In Cloudinary Console → Settings → API Keys, assign the "Upload assets" role to your key, or use the Root API key. You can also set CLOUDINARY_UPLOAD_PRESET to an unsigned preset, or IMAGE_STORAGE=local for development.',
        };
      }

      return {
        ok: false,
        mode: 'cloudinary',
        message: `Cloudinary upload check failed: ${this.getErrorMessage(error)}`,
      };
    }
  }

  extractPublicId(imageUrl: string): string | null {
    if (!imageUrl.includes('cloudinary.com')) {
      return null;
    }

    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    return match?.[1] ?? null;
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadedImageResult> {
    const result = await this.uploadBufferToCloudinary(
      file.buffer,
      folder,
      file.originalname,
      file.mimetype,
    );
    return this.mapUploadResult(result);
  }

  private uploadBufferToCloudinary(
    buffer: Buffer,
    folder: string,
    originalName: string,
    mimeType: string,
  ): Promise<UploadApiResponse> {
    const uploadFolder = `olx-clone/${folder}`;
    const options: Record<string, unknown> = {
      folder: uploadFolder,
      resource_type: 'image',
    };

    if (config.cloudinary.uploadPreset) {
      options.upload_preset = config.cloudinary.uploadPreset;
    } else {
      options.public_id = this.buildPublicId(originalName);
      options.overwrite = false;
      options.unique_filename = true;
    }

    const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return cloudinary.uploader.upload(dataUri, options);
  }

  private mapUploadResult(result: UploadApiResponse): UploadedImageResult {
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }

  private async uploadLocal(file: Express.Multer.File, folder: string): Promise<UploadedImageResult> {
    const extension = path.extname(file.originalname) || this.mimeToExtension(file.mimetype);
    const fileName = `${this.buildPublicId(file.originalname)}${extension}`;
    const relativePath = path.posix.join('olx-clone', folder, fileName);
    const absolutePath = path.join(UPLOADS_DIR, relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    const url = `${config.publicBaseUrl.replace(/\/$/, '')}/uploads/${relativePath.replace(/\\/g, '/')}`;
    return {
      url,
      publicId: relativePath.replace(/\\/g, '/'),
      format: extension.replace('.', ''),
    };
  }

  private async deleteLocalImage(imageUrl: string): Promise<void> {
    const relativePath = this.getLocalRelativePath(imageUrl);
    if (!relativePath) {
      return;
    }

    const absolutePath = path.join(UPLOADS_DIR, relativePath);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      logger.error(`Local image delete failed for ${absolutePath}`, error);
    }
  }

  private isLocalImageUrl(imageUrl: string): boolean {
    return imageUrl.includes('/uploads/olx-clone/');
  }

  private getLocalRelativePath(imageUrl: string): string | null {
    const marker = '/uploads/';
    const index = imageUrl.indexOf(marker);
    if (index === -1) {
      return null;
    }

    return imageUrl.slice(index + marker.length);
  }

  private shouldFallbackToLocal(error: unknown): boolean {
    return config.env === 'development' && this.isCloudinaryPermissionError(error);
  }

  private isCloudinaryPermissionError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const err = error as { http_code?: number; message?: string; error?: { message?: string } };
    const message = err.message ?? err.error?.message ?? '';
    return err.http_code === 403 || message.includes('missing permissions');
  }

  private toUploadError(error: unknown): InternalServerError {
    logger.error('Cloudinary upload failed', error);

    if (this.isCloudinaryPermissionError(error)) {
      return new InternalServerError(
        'Cloudinary upload is blocked: your API key lacks upload permissions. Assign the "Upload assets" role in Cloudinary Console → Settings → API Keys, or set CLOUDINARY_UPLOAD_PRESET / IMAGE_STORAGE=local.',
      );
    }

    return new InternalServerError(`Failed to upload image: ${this.getErrorMessage(error)}`);
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const err = error as { message?: string; error?: { message?: string } };
      return err.error?.message ?? err.message ?? 'Unknown Cloudinary error';
    }

    return 'Unknown Cloudinary error';
  }

  private buildPublicId(originalName: string): string {
    const baseName = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^\w-]+/g, '-')
      .toLowerCase();
    return `${baseName}-${Date.now()}`;
  }

  private mimeToExtension(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
      default:
        return '.jpg';
    }
  }
}

export default new CloudinaryService();
