import multer, { MulterError } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/AppError';

const memoryStorage = multer.memoryStorage();

const imageFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
    return;
  }

  callback(new BadRequestError('Invalid image type. Allowed: JPEG, PNG, WEBP, GIF'));
};

const upload = multer({
  storage: memoryStorage,
  limits: {
    files: 1,
  },
  fileFilter: imageFilter,
});

const propertyUpload = multer({
  storage: memoryStorage,
  limits: {
    files: 10,
  },
  fileFilter: imageFilter,
});

/**
 * Accepts a single optional image file from multipart/form-data.
 * JSON requests without a file continue to work normally.
 */
export const uploadSingleImage = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, res, (error: unknown) => {
      if (error instanceof MulterError) {
        next(new BadRequestError(error.message));
        return;
      }

      if (error instanceof BadRequestError) {
        next(error);
        return;
      }

      if (error) {
        next(error);
        return;
      }

      next();
    });
  };
};

/** Accepts up to ten property images from multipart/form-data. */
export const uploadPropertyImages = (fieldName = 'images') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    propertyUpload.array(fieldName, 10)(req, res, (error: unknown) => {
      if (error instanceof MulterError) {
        if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
          next(new BadRequestError('A property can contain a maximum of 10 images'));
          return;
        }
        next(new BadRequestError(error.message));
        return;
      }
      if (error instanceof BadRequestError || error) {
        next(error);
        return;
      }
      next();
    });
  };
};
