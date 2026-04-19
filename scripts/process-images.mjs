import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

const SECTIONS = [
  { name: 'logo',     ratio: null,     maxWidth: null  },
  { name: 'hero',     ratio: [16, 9],  maxWidth: 1920 },
  { name: 'welcome',  ratio: [4, 3],   maxWidth: 800  },
  { name: 'services', ratio: [4, 3],   maxWidth: 600  },
  { name: 'about',    ratio: [4, 3],   maxWidth: 800  },
  { name: 'gallery',  ratio: [1, 1],   maxWidth: 800  },
];

const SOURCE = './COMPANY-PHOTOS';
const OUTPUT = './src/assets/images';

function getOutputName(section, file, index, totalFiles) {
  const ext = path.extname(file);
  const baseName = path.basename(file, ext)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

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
      // Fix typo: deeck-restoration -> deck-restoration
      const fixedName = baseName.replace('deeck-restoration', 'deck-restoration');
      return `${fixedName}.jpg`;
    case 'gallery':
      return `gallery-${String(index + 1).padStart(2, '0')}.jpg`;
    default:
      return `${section.name}-${index + 1}.jpg`;
  }
}

async function processSection(section) {
  const srcDir = path.join(SOURCE, section.name);
  const outDir = path.join(OUTPUT, section.name);
  
  try {
    await fs.mkdir(outDir, { recursive: true });
  } catch (e) {
    // Directory exists
  }

  const files = await glob(`${srcDir}/*.{jpg,jpeg,png,webp,svg,JPG,JPEG,PNG,SVG}`);

  if (files.length === 0) {
    console.warn(`⚠️  No images found in ${srcDir}/`);
    return;
  }

  console.log(`📁 Processing ${section.name}/ (${files.length} files)`);
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const outputName = getOutputName(section, file, i, files.length);
    const outputPath = path.join(outDir, outputName);

    // Logo: just copy without processing (may be SVG)
    if (section.ratio === null) {
      await fs.copyFile(file, outputPath);
      console.log(`  ✅ ${outputName} (copied as-is)`);
      continue;
    }

    const [rw, rh] = section.ratio;
    const targetWidth = section.maxWidth;
    const targetHeight = Math.round(targetWidth * rh / rw);

    await sharp(file)
      .resize(targetWidth, targetHeight, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    console.log(`  ✅ ${outputName} (${targetWidth}×${targetHeight})`);
  }
}

async function main() {
  console.log('📸 Processing COMPANY-PHOTOS...\n');

  for (const section of SECTIONS) {
    await processSection(section);
  }

  console.log('\n🎉 Done! Images ready in src/assets/images/');
}

main().catch(console.error);
