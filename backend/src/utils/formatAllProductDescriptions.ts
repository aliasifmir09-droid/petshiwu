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

    // Get all products, prioritizing those with longer descriptions
    const products = await Product.find({}).lean();
    console.log(`📦 Found ${products.length} products to process\n`);
    
    // Find products with longer descriptions (likely to have headings)
    const productsWithLongDescriptions = products.filter(p => 
      p.description && p.description.length > 100
    );
    console.log(`📝 Found ${productsWithLongDescriptions.length} products with descriptions > 100 characters\n`);
    
    // Show a few examples of longer descriptions
    if (productsWithLongDescriptions.length > 0) {
      console.log('📋 Sample products with longer descriptions:');
      productsWithLongDescriptions.slice(0, 3).forEach((p, idx) => {
        console.log(`\n   ${idx + 1}. ${p.name}`);
        console.log(`      Description length: ${p.description.length} chars`);
        console.log(`      Preview: ${p.description.substring(0, 300)}...`);
        console.log(`      Has colon pattern: ${/:\s*/.test(p.description)}`);
        console.log(`      Has known heading: ${/(Key\s*Benefits?|Features?\s*&?\s*Benefits?|Item\s*Number|Brand|Food\s*Type|Breed\s*Size|Life\s*Stage|Nutritional\s*Benefits?|Health\s*Considerations?|Flavor|Weight|Ingredients?|Guaranteed\s*Analysis|Caloric\s*Content|Transition\s*Instructions?|Species|Warranty|Dimensions?|Color|Size|Material|Care\s*Instructions?):/i.test(p.description)}`);
        console.log(`      Has markdown: ${p.description.includes('**')}`);
        // Test formatting on this product
        const testFormatted = formatProductDescription(p.description);
        console.log(`      Formatted preview: ${testFormatted.substring(0, 300)}...`);
        console.log(`      Formatted has markdown: ${testFormatted.includes('**')}`);
        console.log(`      Would update: ${testFormatted !== p.description}`);
      });
      console.log('\n');
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
            console.log(`   ✓ Updated: ${product.name.substring(0, 50)}${product.name.length > 50 ? '...' : ''}`);
            if (updated <= 5) {
              // Show first few examples
              console.log(`      Before: ${originalDescription.substring(0, 100)}...`);
              console.log(`      After: ${formattedDescription.substring(0, 100)}...`);
            }
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
    console.log(`   📝 Products with headings detected: ${productsWithHeadings}`);
    console.log(`   ✨ Products already with markdown: ${productsWithMarkdown}`);
    console.log(`   🔄 Products needing formatting: ${productsNeedingFormat}`);
    console.log('='.repeat(60) + '\n');
    
    if (updated === 0 && productsNeedingFormat === 0) {
      console.log('ℹ️  Note: No products were updated because:');
      console.log('   - Most products have short descriptions (just product names)');
      console.log('   - Products with headings are already formatted');
      console.log('   - No products were found with unformatted headings\n');
      console.log('💡 To format descriptions:');
      console.log('   - Import products via CSV with headings like "Key Benefits:", "Weight:", etc.');
      console.log('   - The formatter will automatically apply formatting during CSV import\n');
    }

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

