import { Request, Response } from 'express';
import propertyService from '../services/property.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { PropertyStatus, RentType } from '../interfaces/property.interface';
import propertyEngagementService from '../services/property-engagement.service';

const id = (req: Request): string =>
  Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
const files = (req: Request): Express.Multer.File[] => (Array.isArray(req.files) ? req.files : []);
const filters = (req: Request) => ({
  search: req.query.search as string,
  category: req.query.category as string,
  city: req.query.city as string,
  area: req.query.area as string,
  owner: req.query.owner as string,
  status: req.query.status as PropertyStatus,
  rentType: req.query.rentType as RentType,
  propertyType: req.query.propertyType as string,
  minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
  maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
  bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
  bathrooms: req.query.bathrooms ? Number(req.query.bathrooms) : undefined,
  furnished: req.query.furnished === undefined ? undefined : req.query.furnished === 'true',
  parking: req.query.parking === undefined ? undefined : req.query.parking === 'true',
  elevator: req.query.elevator === undefined ? undefined : req.query.elevator === 'true',
  balcony: req.query.balcony === undefined ? undefined : req.query.balcony === 'true',
  airConditioner:
    req.query.airConditioner === undefined ? undefined : req.query.airConditioner === 'true',
  internet: req.query.internet === undefined ? undefined : req.query.internet === 'true',
  featured: req.query.featured === undefined ? undefined : req.query.featured === 'true',
  isDeleted: req.query.isDeleted === undefined ? undefined : req.query.isDeleted === 'true',
  page: req.query.page ? Number(req.query.page) : 1,
  limit: req.query.limit ? Number(req.query.limit) : 10,
  sort: req.query.sort as string,
});

export const createProperty = asyncHandler(async (req, res) => {
  const property = await propertyService.createProperty(
    req.user!._id.toString(),
    req.body,
    files(req),
  );
  ApiResponse.success(res, 201, 'Property created and submitted for approval', property);
});
export const getProperties = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(
    res,
    200,
    'Properties retrieved successfully',
    await propertyService.getProperties(filters(req), req.user?.role === 'admin'),
  );
});
export const getMyProperties = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(
    res,
    200,
    'My properties retrieved successfully',
    await propertyService.getMyProperties(req.user!._id.toString(), filters(req)),
  );
});
export const getPropertyById = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.getPropertyById(
    id(req),
    req.user?._id.toString() ?? req.ip ?? 'anonymous',
  );
  if (req.user)
    await propertyEngagementService.recordRecentlyViewed(req.user._id.toString(), id(req));
  ApiResponse.success(res, 200, 'Property retrieved successfully', property);
});
export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.updateProperty(
    id(req),
    req.user!._id.toString(),
    req.user!.role === 'admin',
    req.body,
    files(req),
  );
  ApiResponse.success(res, 200, 'Property updated successfully', property);
});
export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(
    res,
    200,
    'Property deleted successfully',
    await propertyService.deleteProperty(
      id(req),
      req.user!._id.toString(),
      req.user!.role === 'admin',
    ),
  );
});
export const addPropertyImages = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.addImages(
    id(req),
    req.user!._id.toString(),
    req.user!.role === 'admin',
    files(req),
  );
  ApiResponse.success(res, 200, 'Property images added successfully', property);
});
export const deletePropertyImage = asyncHandler(async (req: Request, res: Response) => {
  const imageIndex = Number(
    Array.isArray(req.params.imageId) ? req.params.imageId[0] : req.params.imageId,
  );
  const property = await propertyService.deleteImage(
    id(req),
    imageIndex,
    req.user!._id.toString(),
    req.user!.role === 'admin',
  );
  ApiResponse.success(res, 200, 'Property image deleted successfully', property);
});
export const restoreProperty = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(
    res,
    200,
    'Property restored and submitted for approval',
    await propertyService.restoreProperty(id(req)),
  );
});
const status = (value: PropertyStatus, message: string) =>
  asyncHandler(async (req: Request, res: Response) => {
    ApiResponse.success(
      res,
      200,
      message,
      await propertyService.changeStatus(
        id(req),
        req.user!._id.toString(),
        req.user!.role === 'admin',
        value,
      ),
    );
  });
export const approveProperty = status(PropertyStatus.ACTIVE, 'Property approved successfully');
export const rejectProperty = status(PropertyStatus.REJECTED, 'Property rejected successfully');
export const rentProperty = status(PropertyStatus.RENTED, 'Property marked as rented');
export const archiveProperty = status(PropertyStatus.ARCHIVED, 'Property archived successfully');
export const featureProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.updateProperty(id(req), req.user!._id.toString(), true, {
    featured: true,
  });
  ApiResponse.success(res, 200, 'Property featured successfully', property);
});
export const unfeatureProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.updateProperty(id(req), req.user!._id.toString(), true, {
    featured: false,
  });
  ApiResponse.success(res, 200, 'Property unfeatured successfully', property);
});
