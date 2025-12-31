import mongoose from 'mongoose';
import Product from '../models/Product';
import { formatProductDescription } from '../utils/descriptionFormatter';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Formats descriptions for all existing products in the database
 * This is a one-time migration script to update existing products
 */
const formatAllProductDescriptions = async () => {
  try {
    logger.info('🔄 Starting to format all product descriptions...\n');

    // Connect to database using existing utility
    await connectDatabase();
    logger.info('✅ Connected to MongoDB\n');

    // Get all products, prioritizing those with longer descriptions
    const products = await Product.find({}).lean();
    logger.info(`📦 Found ${products.length} products to process\n`);
    
    // Find products with longer descriptions (likely to have headings)
    const productsWithLongDescriptions = products.filter(p => 
      p.description && p.description.length > 100
    );
    logger.info(`📝 Found ${productsWithLongDescriptions.length} products with descriptions > 100 characters\n`);
    
    // Show a few examples of longer descriptions
    if (productsWithLongDescriptions.length > 0) {
      logger.info('📋 Sample products with longer descriptions:');
      productsWithLongDescriptions.slice(0, 3).forEach((p, idx) => {
        logger.info(`\n   ${idx + 1}. ${p.name}`);
        logger.info(`      Description length: ${p.description.length} chars`);
        logger.info(`      Preview: ${p.description.substring(0, 300)}...`);
        logger.info(`      Has colon pattern: ${/:\s*/.test(p.description)}`);
        logger.info(`      Has known heading: ${/(Key\s*Benefits?|Features?\s*&?\s*Benefits?|Item\s*Number|Brand|Food\s*Type|Breed\s*Size|Life\s*Stage|Nutritional\s*Benefits?|Health\s*Considerations?|Flavor|Weight|Ingredients?|Guaranteed\s*Analysis|Caloric\s*Content|Transition\s*Instructions?|Species|Warranty|Dimensions?|Color|Size|Material|Care\s*Instructions?):/i.test(p.description)}`);
        logger.info(`      Has markdown: ${p.description.includes('**')}`);
        // Test formatting on this product
        const testFormatted = formatProductDescription(p.description);
        logger.info(`      Formatted preview: ${testFormatted.substring(0, 300)}...`);
        logger.info(`      Formatted has markdown: ${testFormatted.includes('**')}`);
        logger.info(`      Would update: ${testFormatted !== p.description}`);
      });
      logger.info('\n');
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let productsWithHeadings = 0;
    let productsWithMarkdown = 0;
    let productsNeedingFormat = 0;

    // Process each product in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)} (${batch.length} products)...`);

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

          // Check if formatting changed something
          // More aggressive detection: check for heading patterns that should be formatted
          const hasHeadingPattern = /^[A-Z][^:]{0,49}?:\s*.+$/m.test(originalDescription);
          const hasKnownHeading = /(Key\s*Benefits?|Features?\s*&?\s*Benefits?|Item\s*Number|Brand|Food\s*Type|Breed\s*Size|Life\s*Stage|Nutritional\s*Benefits?|Health\s*Considerations?|Flavor|Weight|Ingredients?|Guaranteed\s*Analysis|Caloric\s*Content|Transition\s*Instructions?|Species|Warranty|Dimensions?|Color|Size|Material|Care\s*Instructions?):/i.test(originalDescription);
          
          // Check if formatted description contains markdown bold markers
          const hasMarkdownBold = formattedDescription.includes('**');
          const originalHasMarkdown = originalDescription.includes('**');
          
          // Normalize both to account for whitespace differences
          const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
          const normalizedOriginal = normalize(originalDescription);
          const normalizedFormatted = normalize(formattedDescription);
          
          // Check if strings are different (even after normalization)
          const stringsDiffer = normalizedFormatted !== normalizedOriginal;
          
          // Check if markdown was added
          const markdownAdded = hasMarkdownBold && !originalHasMarkdown;
          
          // Check if raw strings differ (whitespace, line breaks, etc.)
          const rawStringsDiffer = formattedDescription.trim() !== originalDescription.trim();
          
          // Track statistics
          if (hasHeadingPattern || hasKnownHeading) {
            productsWithHeadings++;
          }
          if (originalHasMarkdown) {
            productsWithMarkdown++;
          }
          
          // Check if original has headings that should be formatted but aren't
          // This is the key: if we detect headings in the original but no markdown, we should format
          const hasUnformattedHeadings = (hasHeadingPattern || hasKnownHeading) && !originalHasMarkdown;
          
          if (hasUnformattedHeadings) {
            productsNeedingFormat++;
          }
          
          // Update if:
          // 1. Formatted version is different (even after normalization)
          // 2. Formatted version has markdown markers but original doesn't
          // 3. Raw strings differ (whitespace/formatting changes)
          // 4. Original has heading patterns that should be formatted (FORCE UPDATE)
          // 5. Formatted version has markdown but original doesn't (even if normalized strings match)
          const shouldUpdate = stringsDiffer || 
                               markdownAdded || 
                               rawStringsDiffer ||
                               hasUnformattedHeadings ||
                               (hasMarkdownBold && !originalHasMarkdown && formattedDescription.length > 0);
          
          if (shouldUpdate) {
            await Product.updateOne(
              { _id: product._id },
              { $set: { description: formattedDescription } }
            );
            updated++;
            logger.info(`   ✓ Updated: ${product.name.substring(0, 50)}${product.name.length > 50 ? '...' : ''}`);
            if (updated <= 5) {
              // Show first few examples
              logger.info(`      Before: ${originalDescription.substring(0, 100)}...`);
              logger.info(`      After: ${formattedDescription.substring(0, 100)}...`);
            }
          } else {
            skipped++;
          }
        } catch (error: any) {
          errors++;
          logger.error(`   ✗ Error updating product ${product._id}:`, error.message);
        }
      }
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('📊 Migration Summary:');
    logger.info(`   ✅ Updated: ${updated} products`);
    logger.info(`   ⏭️  Skipped: ${skipped} products (no description or already formatted)`);
    logger.info(`   ❌ Errors: ${errors} products`);
    logger.info(`   📦 Total: ${products.length} products`);
    logger.info(`   📝 Products with headings detected: ${productsWithHeadings}`);
    logger.info(`   ✨ Products already with markdown: ${productsWithMarkdown}`);
    logger.info(`   🔄 Products needing formatting: ${productsNeedingFormat}`);
    logger.info('='.repeat(60) + '\n');
    
    if (updated === 0 && productsNeedingFormat === 0) {
      logger.info('ℹ️  Note: No products were updated because:');
      logger.info('   - Most products have short descriptions (just product names)');
      logger.info('   - Products with headings are already formatted');
      logger.info('   - No products were found with unformatted headings\n');
      logger.info('💡 To format descriptions:');
      logger.info('   - Import products via CSV with headings like "Key Benefits:", "Weight:", etc.');
      logger.info('   - The formatter will automatically apply formatting during CSV import\n');
    }

    // Close connection
    await mongoose.connection.close();
    logger.info('✅ Database connection closed\n');
    
    return {
      success: true,
      updated,
      skipped,
      errors,
      total: products.length
    };
  } catch (error: any) {
    logger.error('❌ Migration failed:', error.message);
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
      logger.info('✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

