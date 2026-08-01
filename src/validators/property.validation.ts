import { z } from 'zod';
import { PropertyStatus, RentType } from '../interfaces/property.interface';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const optionalNumber = z.number().finite().optional();
const propertyBody = z.object({
  category: objectId,
  city: objectId,
  area: objectId,
  title: z.string().min(3).max(150),
  description: z.string().min(10).max(5000),
  price: z.number().nonnegative(),
  currency: z.string().length(3).optional(),
  rentType: z.nativeEnum(RentType),
  propertyType: z.string().min(2).max(80),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  floor: optionalNumber,
  areaSize: z.number().positive(),
  furnished: z.boolean().optional(),
  parking: z.boolean().optional(),
  balcony: z.boolean().optional(),
  elevator: z.boolean().optional(),
  airConditioner: z.boolean().optional(),
  internet: z.boolean().optional(),
  kitchen: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().min(3).max(300),
});

export const createPropertySchema = z.object({ body: propertyBody });
export const updatePropertySchema = z.object({
  params: z.object({ id: objectId }),
  body: propertyBody.partial().extend({ featured: z.boolean().optional() }),
});
export const propertyIdSchema = z.object({ params: z.object({ id: objectId }) });
export const propertyImageIdSchema = z.object({
  params: z.object({
    id: objectId,
    // Images are intentionally stored as URL strings; imageId is their zero-based array index.
    imageId: z.string().regex(/^\d+$/, 'Image ID must be a zero-based image index'),
  }),
});
export const propertyQuerySchema = z.object({
  query: z.object({
    search: z.string().max(100).optional(),
    category: objectId.optional(),
    city: objectId.optional(),
    area: objectId.optional(),
    owner: objectId.optional(),
    status: z.nativeEnum(PropertyStatus).optional(),
    rentType: z.nativeEnum(RentType).optional(),
    propertyType: z.string().max(80).optional(),
    minPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .optional(),
    maxPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .optional(),
    bedrooms: z.string().regex(/^\d+$/).optional(),
    bathrooms: z.string().regex(/^\d+$/).optional(),
    furnished: z.enum(['true', 'false']).optional(),
    parking: z.enum(['true', 'false']).optional(),
    elevator: z.enum(['true', 'false']).optional(),
    balcony: z.enum(['true', 'false']).optional(),
    airConditioner: z.enum(['true', 'false']).optional(),
    internet: z.enum(['true', 'false']).optional(),
    featured: z.enum(['true', 'false']).optional(),
    isDeleted: z.enum(['true', 'false']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z
      .enum(['newest', 'oldest', 'lowestPrice', 'highestPrice', 'mostViewed', 'mostRecent'])
      .optional(),
  }),
});
