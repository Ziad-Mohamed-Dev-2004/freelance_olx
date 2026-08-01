/**
 * Coerce multipart/form-data string values into typed request body fields.
 */
export const parseOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return undefined;
};

export const parseOptionalNullableString = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '' || value === 'null') {
    return null;
  }

  return String(value);
};

export const normalizeCategoryBody = (body: Record<string, unknown>): Record<string, unknown> => ({
  ...body,
  isActive: parseOptionalBoolean(body.isActive),
  parentCategory: parseOptionalNullableString(body.parentCategory),
});

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

/** Coerce multipart property fields before Zod validation. */
export const normalizePropertyBody = (body: Record<string, unknown>): Record<string, unknown> => {
  const normalized: Record<string, unknown> = { ...body };
  for (const field of [
    'price',
    'bedrooms',
    'bathrooms',
    'floor',
    'areaSize',
    'latitude',
    'longitude',
  ]) {
    normalized[field] = parseOptionalNumber(body[field]);
  }
  for (const field of [
    'furnished',
    'parking',
    'balcony',
    'elevator',
    'airConditioner',
    'internet',
    'kitchen',
  ]) {
    normalized[field] = parseOptionalBoolean(body[field]);
  }
  return normalized;
};
