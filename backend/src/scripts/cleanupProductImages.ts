import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import Product from '../models/Product';
import { deleteFromCloudinary, isCloudinaryConfigured } from '../utils/cloudinary';
import mongoose from 'mongoose';

dotenv.config();

/**
 * Extract public_id from Cloudinary URL
 * Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
 */
const extractPublicId = (url: string): string | null => {
  try {
    if (!url || typeof url !== 'string') return null;
    
    // Check if it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) return null;
    
    // Extract path after /upload/
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    
    const pathPart = url.substring(uploadIndex + '/upload/'.length);
    
    // Remove version prefix if present (v1234567890/)
    const pathWithoutVersion = pathPart.replace(/^v\d+\//, '');
    
    // Extract public_id (remove file extension and any transformations)
    // Handle transformations: public_id?transformation or public_id/transformation
    let publicId = pathWithoutVersion.split('?')[0].split('/')[0];
    
    // Remove file extension
    publicId = publicId.replace(/\.[^/.]+$/, '');
    
    // Remove folder prefix if present (pet-shop/image/)
    if (publicId.includes('/')) {
      const parts = publicId.split('/');
      publicId = parts.slice(2).join('/'); // Skip 'pet-shop' and 'image'
    }
    
    return publicId || null;
  } catch (error) {
    return null;
  }
};

/**
 * Delete product images from Cloudinary and database
 */
const cleanupProductImages = async (options: {
  deleteFromCloudinary: boolean;
  removeFromDatabase: boolean;
  productId?: string;
  deleteAllProducts?: boolean;
  dryRun?: boolean;
}) => {
  try {
    await connectDatabase();
    console.log('✅ Connected to database\n');

    const { deleteFromCloudinary: deleteCloudinary, removeFromDatabase, productId, deleteAllProducts, dryRun } = options;

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Check Cloudinary configuration
    if (deleteCloudinary && !isCloudinaryConfigured()) {
      console.error('❌ Cloudinary is not configured!');
      console.error('   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env\n');
      if (deleteCloudinary) {
        console.log('⚠️  Skipping Cloudinary deletion, continuing with database cleanup...\n');
      }
    }

    let query: any = {};
    if (productId) {
      query._id = new mongoose.Types.ObjectId(productId);
    }

    const products = deleteAllProducts 
      ? await Product.find({})
      : await Product.find(query);

    console.log(`📦 Found ${products.length} product(s) to process\n`);

    if (products.length === 0) {
      console.log('ℹ️  No products found. Exiting.\n');
      await mongoose.connection.close();
      return;
    }

    let cloudinaryDeleted = 0;
    let cloudinaryFailed = 0;
    let databaseUpdated = 0;
    let totalImagesProcessed = 0;

    for (const product of products) {
      console.log(`\n📦 Processing: ${product.name} (${product._id})`);
      
      const allImageUrls: string[] = [
        ...(product.images || []),
        ...(product.variants?.flatMap(v => [
          ...(v.image ? [v.image] : []),
          ...(v.images || [])
        ]) || [])
      ];

      console.log(`   Found ${allImageUrls.length} image(s)`);

      if (allImageUrls.length === 0) {
        console.log('   ⏭️  No images to process');
        continue;
      }

      totalImagesProcessed += allImageUrls.length;

      // Delete from Cloudinary
      if (deleteCloudinary && isCloudinaryConfigured()) {
        for (const imageUrl of allImageUrls) {
          const publicId = extractPublicId(imageUrl);
          
          if (!publicId) {
            console.log(`   ⚠️  Could not extract public_id from: ${imageUrl.substring(0, 50)}...`);
            continue;
          }

          if (dryRun) {
            console.log(`   🔍 Would delete from Cloudinary: ${publicId}`);
            cloudinaryDeleted++;
          } else {
            try {
              await deleteFromCloudinary(publicId, 'image');
              console.log(`   ✅ Deleted from Cloudinary: ${publicId}`);
              cloudinaryDeleted++;
            } catch (error: any) {
              console.log(`   ❌ Failed to delete from Cloudinary: ${publicId} - ${error.message}`);
              cloudinaryFailed++;
            }
          }
        }
      }

      // Remove from database
      if (removeFromDatabase) {
        if (dryRun) {
          console.log(`   🔍 Would remove images from database`);
          databaseUpdated++;
        } else {
          // Clear product images
          product.images = [];
          
          // Clear variant images
          if (product.variants) {
            product.variants = product.variants.map(variant => {
              const variantObj = variant instanceof mongoose.Document ? variant.toObject() : variant;
              return {
                ...variantObj,
                image: undefined,
                images: undefined
              };
            });
          }
          
          await product.save();
          console.log(`   ✅ Removed images from database`);
          databaseUpdated++;
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Cleanup Summary:');
    console.log('='.repeat(50));
    console.log(`   Products processed: ${products.length}`);
    console.log(`   Total images processed: ${totalImagesProcessed}`);
    
    if (deleteCloudinary) {
      console.log(`   Cloudinary deletions: ${cloudinaryDeleted}`);
      if (cloudinaryFailed > 0) {
        console.log(`   Cloudinary failures: ${cloudinaryFailed}`);
      }
    }
    
    if (removeFromDatabase) {
      console.log(`   Database updates: ${databaseUpdated}`);
    }
    
    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made');
      console.log('   Run without --dry-run to apply changes\n');
    } else {
      console.log('\n✅ Cleanup completed!\n');
    }

    await mongoose.connection.close();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// CLI interface
const args = process.argv.slice(2);
const options: any = {
  deleteFromCloudinary: args.includes('--cloudinary') || args.includes('--all'),
  removeFromDatabase: args.includes('--database') || args.includes('--all'),
  dryRun: args.includes('--dry-run'),
};

// Check for product ID
const productIdIndex = args.indexOf('--product-id');
if (productIdIndex !== -1 && args[productIdIndex + 1]) {
  options.productId = args[productIdIndex + 1];
}

// Check for delete all products
if (args.includes('--delete-all-products')) {
  options.deleteAllProducts = true;
}

// Show help
if (args.includes('--help') || args.length === 0) {
  console.log(`
🗑️  Product Images Cleanup Utility

Usage:
  ts-node src/utils/cleanupProductImages.ts [options]

Options:
  --cloudinary          Delete images from Cloudinary
  --database            Remove image URLs from database
  --all                 Delete from both Cloudinary and database
  --product-id <id>     Process specific product only
  --delete-all-products Delete images from all products
  --dry-run             Show what would be done without making changes
  --help                Show this help message

Examples:
  # Dry run - see what would be deleted
  ts-node src/utils/cleanupProductImages.ts --all --dry-run

  # Delete from Cloudinary only (keep URLs in database)
  ts-node src/utils/cleanupProductImages.ts --cloudinary

  # Remove URLs from database only (keep images in Cloudinary)
  ts-node src/utils/cleanupProductImages.ts --database

  # Delete from both Cloudinary and database
  ts-node src/utils/cleanupProductImages.ts --all

  # Delete images for specific product
  ts-node src/utils/cleanupProductImages.ts --all --product-id <product-id>

  # Delete all product images
  ts-node src/utils/cleanupProductImages.ts --all --delete-all-products

⚠️  WARNING: This is a destructive operation!
   Always use --dry-run first to see what will be deleted.
`);
  process.exit(0);
}

// Run cleanup
cleanupProductImages(options);

