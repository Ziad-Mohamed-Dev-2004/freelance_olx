import dotenv from 'dotenv';
import path from 'path';
import cloudinaryService from '../services/cloudinary.service';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function test() {
  console.log('\nCloudinary / image upload diagnostics\n');

  const status = await cloudinaryService.verifyUploadAccess();

  if (status.ok) {
    console.log(`✅ Uploads are working (${status.mode} mode).`);
    process.exit(0);
  }

  console.log('❌ Upload check failed.');
  console.log(`\n${status.message}\n`);
  console.log('Fix options:');
  console.log('1. Cloudinary Console → Settings → API Keys');
  console.log('   Assign "Upload assets" role to your API key, or copy the Root API key.');
  console.log('2. Create an unsigned upload preset and set CLOUDINARY_UPLOAD_PRESET in .env');
  console.log('3. For local development, set IMAGE_STORAGE=local in .env');
  process.exit(1);
}

test().catch((error) => {
  console.error('Unexpected test failure:', error);
  process.exit(1);
});
