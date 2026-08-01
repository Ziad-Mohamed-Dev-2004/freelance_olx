import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary.config';
import { BadRequestError, InternalServerError } from '../utils/AppError';
import logger from '../utils/logger';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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

    try {
      const result = await this.uploadBuffer(file.buffer, folder, file.originalname);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (error) {
      logger.error('Cloudinary upload failed', error);
      throw new InternalServerError('Failed to upload image');
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
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

  extractPublicId(imageUrl: string): string | null {
    if (!imageUrl.includes('cloudinary.com')) {
      return null;
    }

    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    return match?.[1] ?? null;
  }

  private uploadBuffer(
    buffer: Buffer,
    folder: string,
    originalName: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `olx-clone/${folder}`,
          resource_type: 'image',
          public_id: this.buildPublicId(originalName),
          overwrite: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload returned empty result'));
            return;
          }
          resolve(result);
        },
      );

      uploadStream.end(buffer);
    });
  }

  private buildPublicId(originalName: string): string {
    const baseName = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^\w-]+/g, '-')
      .toLowerCase();
    return `${baseName}-${Date.now()}`;
  }
}

export default new CloudinaryService();
