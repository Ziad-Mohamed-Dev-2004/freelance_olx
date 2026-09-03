import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import City from '../models/city.model';
import Area from '../models/area.model';
import { slugify } from '../utils/slugify';
import logger from '../utils/logger';

dotenv.config();

/**
 * Basic CSV Parser supporting quotes
 */
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const parseRow = (rowStr: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]).map((v) => v.replace(/^"|"$/g, '').trim());
    if (values.length === headers.length) {
      const record: Record<string, string> = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx];
      });
      records.push(record);
    }
  }

  return records;
}

export async function seedEgyptLocations(): Promise<{ citiesCount: number; areasCount: number }> {
  const governoratesCsvPath = path.join(process.cwd(), 'governorates.csv');
  const citiesCsvPath = path.join(process.cwd(), 'cities.csv');

  if (!fs.existsSync(governoratesCsvPath) || !fs.existsSync(citiesCsvPath)) {
    throw new Error('governorates.csv or cities.csv missing in workspace root');
  }

  const govRecords = parseCSV(fs.readFileSync(governoratesCsvPath, 'utf-8'));
  const cityRecords = parseCSV(fs.readFileSync(citiesCsvPath, 'utf-8'));

  logger.info(
    `Found ${govRecords.length} governorates and ${cityRecords.length} cities in CSV files.`,
  );

  // 1. Seed Governorates (Cities in DB)
  const existingCities = await City.find({}).lean();
  const existingCityNameMap = new Map(existingCities.map((c) => [c.name, c]));
  const existingSlugs = new Set(existingCities.map((c) => c.slug));

  const govMap = new Map<string, { id: mongoose.Types.ObjectId; nameEn: string }>();
  const citiesToCreate: any[] = [];

  for (const gov of govRecords) {
    const govId = gov.id;
    const govNameAr = gov.governorate_name_ar;
    const govNameEn = gov.governorate_name_en;

    const existing = existingCityNameMap.get(govNameAr);

    if (existing) {
      govMap.set(govId, { id: existing._id as mongoose.Types.ObjectId, nameEn: govNameEn });
    } else {
      let baseSlug = slugify(govNameEn || govNameAr);
      let slug = baseSlug;
      let count = 1;

      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${count}`;
        count++;
      }
      existingSlugs.add(slug);

      const newCityId = new mongoose.Types.ObjectId();
      citiesToCreate.push({
        _id: newCityId,
        name: govNameAr,
        governorate: govNameAr,
        slug,
        isActive: true,
        isDeleted: false,
      });

      govMap.set(govId, { id: newCityId, nameEn: govNameEn });
    }
  }

  if (citiesToCreate.length > 0) {
    await City.insertMany(citiesToCreate);
  }

  // 2. Seed Cities (Areas in DB)
  const existingAreas = await Area.find({}).lean();
  const existingAreaKeySet = new Set(existingAreas.map((a) => `${a.city.toString()}_${a.name}`));
  const existingAreaSlugs = new Set(existingAreas.map((a) => a.slug));

  const areasToCreate: any[] = [];

  for (const cityItem of cityRecords) {
    const govId = cityItem.governorate_id;
    const cityNameAr = cityItem.city_name_ar;
    const cityNameEn = cityItem.city_name_en;

    const govInfo = govMap.get(govId);
    if (!govInfo) continue;

    const areaKey = `${govInfo.id.toString()}_${cityNameAr}`;
    if (existingAreaKeySet.has(areaKey)) continue;

    let baseSlug = slugify(cityNameEn || cityNameAr);
    let slug = baseSlug;
    let count = 1;

    while (existingAreaSlugs.has(slug)) {
      slug = `${baseSlug}-${slugify(govInfo.nameEn || '') || count}`;
      if (existingAreaSlugs.has(slug)) {
        slug = `${baseSlug}-${count}`;
      }
      count++;
    }
    existingAreaSlugs.add(slug);

    areasToCreate.push({
      city: govInfo.id,
      name: cityNameAr,
      slug,
      isActive: true,
      isDeleted: false,
    });
  }

  if (areasToCreate.length > 0) {
    await Area.insertMany(areasToCreate);
  }

  const totalAreasSeeded = areasToCreate.length;
  logger.info(
    `Locations seeded successfully: ${citiesToCreate.length} new Governorates (Cities) created and ${totalAreasSeeded} new Areas created.`,
  );
  return { citiesCount: govMap.size, areasCount: totalAreasSeeded };
}

const runSeederCLI = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_olx';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB for location seeding');

    await seedEgyptLocations();

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding locations:', error);
    process.exit(1);
  }
};

// Execute if run directly from command line
if (require.main === module) {
  runSeederCLI();
}
