/**
 * Image Optimization Script
 * Converts PNG images to AVIF and WebP formats for better performance
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');

// Images to optimize
const imagesToOptimize = [
  {
    input: 'logo.png',
    outputs: [
      { format: 'avif', quality: 85, width: 80, height: 80 },
      { format: 'webp', quality: 85, width: 80, height: 80 }
    ],
    description: 'Logo image (LCP element)'
  },
  {
    input: 'category-vitamins-supplements.png',
    outputs: [
      { format: 'avif', quality: 85 },
      { format: 'webp', quality: 85 }
    ],
    description: 'Category vitamins supplements image'
  }
];

async function optimizeImage(imageConfig) {
  const inputPath = path.join(publicDir, imageConfig.input);
  
  if (!fs.existsSync(inputPath)) {
    console.warn(`⚠️  File not found: ${imageConfig.input}`);
    return;
  }

  console.log(`\n📸 Optimizing ${imageConfig.description} (${imageConfig.input})...`);
  
  // Get original file size
  const originalStats = fs.statSync(inputPath);
  const originalSize = (originalStats.size / 1024).toFixed(2);
  console.log(`   Original size: ${originalSize} KiB`);

  for (const output of imageConfig.outputs) {
    try {
      const outputFileName = imageConfig.input.replace('.png', `.${output.format}`);
      const outputPath = path.join(publicDir, outputFileName);
      
      let sharpInstance = sharp(inputPath);
      
      // Resize if dimensions specified
      if (output.width && output.height) {
        sharpInstance = sharpInstance.resize(output.width, output.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        });
      }
      
      // Convert to format
      if (output.format === 'avif') {
        await sharpInstance
          .avif({ quality: output.quality })
          .toFile(outputPath);
      } else if (output.format === 'webp') {
        await sharpInstance
          .webp({ quality: output.quality })
          .toFile(outputPath);
      }
      
      // Get optimized file size
      const optimizedStats = fs.statSync(outputPath);
      const optimizedSize = (optimizedStats.size / 1024).toFixed(2);
      const savings = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);
      
      console.log(`   ✅ ${outputFileName}: ${optimizedSize} KiB (${savings}% smaller)`);
    } catch (error) {
      console.error(`   ❌ Failed to create ${output.format}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');
  
  for (const imageConfig of imagesToOptimize) {
    await optimizeImage(imageConfig);
  }
  
  console.log('\n✨ Image optimization complete!');
  console.log('\n📋 Optimized files created:');
  console.log('   - logo.avif (AVIF format)');
  console.log('   - logo.webp (WebP format)');
  console.log('   - category-vitamins-supplements.avif');
  console.log('   - category-vitamins-supplements.webp');
  console.log('\n💡 These files will be automatically used by the browser');
  console.log('   based on format support (AVIF > WebP > PNG fallback).');
}

main().catch(console.error);

