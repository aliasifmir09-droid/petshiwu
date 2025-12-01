import mongoose from 'mongoose';
import Product from '../models/Product';
import { formatProductDescription } from './descriptionFormatter';
import { connectDatabase } from './database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Formats descriptions for all existing products in the database
 * This is a one-time migration script to update existing products
 */
const formatAllProductDescriptions = async () => {
  try {
    console.log('🔄 Starting to format all product descriptions...\n');

    // Connect to database using existing utility
    await connectDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Get all products
    const products = await Product.find({}).lean();
    console.log(`📦 Found ${products.length} products to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each product in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)} (${batch.length} products)...`);

      for (const product of batch) {
        try {
          const originalDescription = product.description || '';
          
          // Skip if no description
          if (!originalDescription || originalDescription.trim().length === 0) {
            skipped++;
            continue;
          }

          // Format the description
          const formattedDescription = formatProductDescription(originalDescription);

          // Only update if formatting changed something
          if (formattedDescription !== originalDescription) {
            await Product.updateOne(
              { _id: product._id },
              { $set: { description: formattedDescription } }
            );
            updated++;
            console.log(`   ✓ Updated: ${product.name.substring(0, 50)}${product.name.length > 50 ? '...' : ''}`);
          } else {
            skipped++;
          }
        } catch (error: any) {
          errors++;
          console.error(`   ✗ Error updating product ${product._id}:`, error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated} products`);
    console.log(`   ⏭️  Skipped: ${skipped} products (no description or already formatted)`);
    console.log(`   ❌ Errors: ${errors} products`);
    console.log(`   📦 Total: ${products.length} products`);
    console.log('='.repeat(60) + '\n');

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    
    return {
      success: true,
      updated,
      skipped,
      errors,
      total: products.length
    };
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  formatAllProductDescriptions()
    .then(() => {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

