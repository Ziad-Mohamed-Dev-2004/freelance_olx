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
  const govMap = new Map<string, { id: mongoose.Types.ObjectId; nameEn: string }>();

  for (const gov of govRecords) {
    const govId = gov.id;
    const govNameAr = gov.governorate_name_ar;
    const govNameEn = gov.governorate_name_en;

    let baseSlug = slugify(govNameEn || govNameAr);
    let slug = baseSlug;

    let cityDoc = await City.findOne({ name: govNameAr });

    if (!cityDoc) {
      // Ensure unique slug
      let count = 1;
      while (await City.findOne({ slug })) {
        slug = `${baseSlug}-${count}`;
        count++;
      }

      cityDoc = await City.create({
        name: govNameAr,
        governorate: govNameAr,
        slug,
        isActive: true,
        isDeleted: false,
      });
    }

    govMap.set(govId, { id: cityDoc._id as mongoose.Types.ObjectId, nameEn: govNameEn });
  }

  // 2. Seed Cities (Areas in DB)
  let seededAreasCount = 0;

  for (const cityItem of cityRecords) {
    const govId = cityItem.governorate_id;
    const cityNameAr = cityItem.city_name_ar;
    const cityNameEn = cityItem.city_name_en;

    const govInfo = govMap.get(govId);
    if (!govInfo) continue;

    let areaDoc = await Area.findOne({ city: govInfo.id, name: cityNameAr });

    if (!areaDoc) {
      let baseSlug = slugify(cityNameEn || cityNameAr);
      let slug = baseSlug;

      // Handle duplicate slugs across areas
      let count = 1;
      while (await Area.findOne({ slug })) {
        slug = `${baseSlug}-${slugify(govInfo.nameEn || '') || count}`;
        if (await Area.findOne({ slug })) {
          slug = `${baseSlug}-${count}`;
        }
        count++;
      }

      await Area.create({
        city: govInfo.id,
        name: cityNameAr,
        slug,
        isActive: true,
        isDeleted: false,
      });
      seededAreasCount++;
    }
  }

  logger.info(
    `Locations seeded successfully: ${govMap.size} Governorates (Cities) and ${seededAreasCount} Areas.`,
  );
  return { citiesCount: govMap.size, areasCount: seededAreasCount };
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
