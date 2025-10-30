import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import { connectDatabase } from './database';

const addSlugsToExistingData = async () => {
  try {
    console.log('🔄 Starting slug migration...');
    
    // Connect to database
    await connectDatabase();
    
    // Generate slugs for products without slugs
    const productsWithoutSlugs = await Product.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });
    
    console.log(`📦 Found ${productsWithoutSlugs.length} products without slugs`);
    
    for (const product of productsWithoutSlugs) {
      if (product.name) {
        product.slug = product.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '');
        
        try {
          await product.save();
          console.log(`✅ Updated product: ${product.name} -> ${product.slug}`);
        } catch (error: any) {
          if (error.code === 11000) {
            // Duplicate slug, add product ID to make it unique
            product.slug = `${product.slug}-${product._id.toString().slice(-6)}`;
            await product.save();
            console.log(`✅ Updated product (with ID): ${product.name} -> ${product.slug}`);
          } else {
            console.error(`❌ Error updating product ${product.name}:`, error.message);
          }
        }
      }
    }
    
    // Generate slugs for categories without slugs
    const categoriesWithoutSlugs = await Category.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });
    
    console.log(`📁 Found ${categoriesWithoutSlugs.length} categories without slugs`);
    
    for (const category of categoriesWithoutSlugs) {
      if (category.name) {
        category.slug = category.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '');
        
        try {
          await category.save();
          console.log(`✅ Updated category: ${category.name} -> ${category.slug}`);
        } catch (error: any) {
          if (error.code === 11000) {
            // Duplicate slug, add category ID to make it unique
            category.slug = `${category.slug}-${category._id.toString().slice(-6)}`;
            await category.save();
            console.log(`✅ Updated category (with ID): ${category.name} -> ${category.slug}`);
          } else {
            console.error(`❌ Error updating category ${category.name}:`, error.message);
          }
        }
      }
    }
    
    console.log('✅ Slug migration completed!');
    console.log(`   - Products updated: ${productsWithoutSlugs.length}`);
    console.log(`   - Categories updated: ${categoriesWithoutSlugs.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
addSlugsToExistingData();

