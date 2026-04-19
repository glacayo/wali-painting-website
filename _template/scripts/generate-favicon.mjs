// scripts/generate-favicon.mjs
// Run with: node scripts/generate-favicon.mjs
// PURPOSE: Resize the company logo to 50x50 PNG and place it at public/favicon.png
// Uses fit: 'contain' with transparent background to preserve portrait logos without cropping.

import sharp from 'sharp';
import { glob } from 'glob';
import fs from 'fs/promises';

const logoFiles = await glob('./COMPANY-PHOTOS/logo/*.{png,PNG,jpg,jpeg,JPG,JPEG}');

if (logoFiles.length === 0) {
  console.error('❌ No logo found in COMPANY-PHOTOS/logo/');
  process.exit(1);
}

await fs.mkdir('./public', { recursive: true });

await sharp(logoFiles[0])
  .resize(50, 50, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent background
  })
  .png()
  .toFile('./public/favicon.png');

console.log('✅ favicon.png generated at public/favicon.png (50×50)');
