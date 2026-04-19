// scripts/process-images.mjs
// Run with: node scripts/process-images.mjs
// PURPOSE: Crop raw client photos to correct aspect ratios and copy to src/assets/images/
// Astro's <Image /> handles final WebP conversion and compression at build time.

import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

const SECTIONS = [
  { name: 'logo',     ratio: null,     maxWidth: null  }, // No crop — copy as-is
  { name: 'hero',     ratio: [16, 9],  maxWidth: 1920  },
  { name: 'welcome',  ratio: [4, 3],   maxWidth: 800   },
  { name: 'services', ratio: [4, 3],   maxWidth: 600   },
  { name: 'about',    ratio: [4, 3],   maxWidth: 800   },
  { name: 'gallery',  ratio: [1, 1],   maxWidth: 800   },
];

const SOURCE = './COMPANY-PHOTOS';
const OUTPUT = './src/assets/images';

function getOutputName(section, file, index, totalFiles) {
  const ext = path.extname(file);

  switch (section.name) {
    case 'logo':
      return `logo${ext.toLowerCase()}`;
    case 'hero':
      return totalFiles > 1 ? `hero-bg-${index + 1}.jpg` : 'hero-bg.jpg';
    case 'welcome':
      return 'welcome.jpg';
    case 'about':
      return 'about.jpg';
    case 'services':
      const baseName = path.basename(file, ext)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      return `${baseName}.jpg`;
    case 'gallery':
      return `gallery-${String(index + 1).padStart(2, '0')}.jpg`;
    default:
      return `${section.name}-${index + 1}.jpg`;
  }
}

async function processSection(section) {
  const srcDir = path.join(SOURCE, section.name);
  const outDir = path.join(OUTPUT, section.name);
  await fs.mkdir(outDir, { recursive: true });

  const files = await glob(`${srcDir}/*.{jpg,jpeg,png,webp,svg,JPG,JPEG,PNG,SVG}`);

  if (files.length === 0) {
    console.warn(`⚠️  No images found in ${srcDir}/`);
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const outputName = getOutputName(section, file, i, files.length);
    const outputPath = path.join(outDir, outputName);

    if (section.ratio === null) {
      await fs.copyFile(file, outputPath);
      console.log(`  ✅ [${section.name}] ${outputName} (copied as-is)`);
      continue;
    }

    const [rw, rh] = section.ratio;
    const targetWidth = section.maxWidth;
    const targetHeight = Math.round(targetWidth * rh / rw);

    await sharp(file)
      .resize(targetWidth, targetHeight, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    console.log(`  ✅ [${section.name}] ${outputName} (${targetWidth}×${targetHeight})`);
  }
}

async function main() {
  console.log('📸 Processing COMPANY-PHOTOS...\n');
  for (const section of SECTIONS) {
    await processSection(section);
  }
  console.log('\n🎉 Done. Images ready in src/assets/images/');
  console.log('   Astro will handle WebP conversion and compression at build time.');
}

main().catch(console.error);
