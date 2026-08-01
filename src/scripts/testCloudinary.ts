import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET, secure: true });

// Minimal 1x1 transparent PNG
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

async function test() {
  // --- Check account info ---
  console.log('\n🔵 Checking account info...');
  try {
    const info = await cloudinary.api.usage();
    console.log('  ✅ Account Plan   :', (info as any).plan ?? 'unknown');
    console.log('  ✅ Used Storage   :', (info as any).resources ?? 'unknown');
  } catch (e: any) {
    console.error('  ❌ Usage check failed:', e.message, e.http_code);
  }

  // --- List upload presets ---
  console.log('\n🔵 Listing upload presets...');
  try {
    const presets = await cloudinary.api.upload_presets();
    if (presets.presets?.length) {
      presets.presets.forEach((p: any) => {
        console.log(`  - ${p.name} (${p.unsigned ? 'UNSIGNED' : 'signed'})`);
      });
    } else {
      console.log('  (no presets found)');
    }
  } catch (e: any) {
    console.error('  ❌ List presets failed:', e.message);
  }

  // --- Try unsigned upload via HTTP (bypasses SDK signing) ---
  console.log('\n🔵 Test: Unsigned upload via REST API (no preset)...');
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const body = new URLSearchParams({
    file: `data:image/png;base64,${TINY_PNG_B64}`,
    upload_preset: 'ml_default', // Cloudinary default unsigned preset
  });

  await new Promise<void>((resolve) => {
    const req = https.request(
      uploadUrl,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            console.log('  ✅ Unsigned upload OK! URL:', parsed.secure_url);
          } else {
            console.error(`  ❌ Unsigned upload failed: HTTP ${res.statusCode}`);
            try {
              const parsed = JSON.parse(data);
              console.error('  Error:', parsed.error?.message ?? data);
            } catch {
              console.error('  Raw:', data.substring(0, 300));
            }
          }
          resolve();
        });
      },
    );
    req.on('error', (e) => { console.error('  ❌ Request error:', e.message); resolve(); });
    req.write(body.toString());
    req.end();
  });

  console.log('\n--- Done ---');
  console.log('\n📋 ACTION NEEDED:');
  console.log('Go to https://cloudinary.com → Settings → Upload');
  console.log('Look for "Upload Presets" and check if unsigned uploads are blocked,');
  console.log('or if a specific preset is required for all uploads.');
}

test().catch(console.error);
