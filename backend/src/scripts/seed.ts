import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import PetType from '../models/PetType';
import mongoose from 'mongoose';
import logger from '../utils/logger';

dotenv.config();

/**
 * Seeds the database with initial data (users, categories, products, pet types)
 * WARNING: This is a destructive operation that deletes all existing data
 * Protected in production - requires FORCE_SEED=true to run
 */
const seedData = async () => {
  try {
    // PRODUCTION PROTECTION: Prevent accidental data deletion
    const isProduction = process.env.NODE_ENV === 'production';
    const forceSeed = process.env.FORCE_SEED === 'true';
    
    if (isProduction && !forceSeed) {
      logger.error('\n❌❌❌ PRODUCTION SEED BLOCKED ❌❌❌\n');
      logger.error('⚠️  WARNING: Seed script is blocked in production to prevent data loss!');
      logger.error('   This script will DELETE ALL existing data (users, products, categories, pet types).\n');
      logger.error('   To run in production, you MUST set:');
      logger.error('   FORCE_SEED=true\n');
      logger.error('   Example:');
      logger.error('   FORCE_SEED=true npm run seed\n');
      logger.error('   ⚠️  This is a DESTRUCTIVE operation. Use with extreme caution!\n');
      process.exit(1);
    }

    if (isProduction && forceSeed) {
      logger.warn('\n⚠️⚠️⚠️  PRODUCTION SEED MODE ⚠️⚠️⚠️\n');
      logger.warn('⚠️  WARNING: You are about to DELETE ALL existing data!');
      logger.warn('   This includes: Users, Products, Categories, Pet Types\n');
      logger.warn('   Waiting 5 seconds before proceeding...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    await connectDatabase();

    // Count existing data before deletion
    const userCount = await User.countDocuments({});
    const productCount = await Product.countDocuments({});
    const categoryCount = await Category.countDocuments({});
    const petTypeCount = await PetType.countDocuments({});

    logger.info('\n📊 Current Database State:');
    logger.info(`   Users: ${userCount}`);
    logger.info(`   Products: ${productCount}`);
    logger.info(`   Categories: ${categoryCount}`);
    logger.info(`   Pet Types: ${petTypeCount}\n`);

    if (isProduction && forceSeed) {
      logger.warn('⚠️  PROCEEDING WITH DELETION IN 3 SECONDS...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await PetType.deleteMany({});

    logger.info('✅ Existing data cleared');

    // ===== CREATE PET TYPES =====
    const dogPetType = await PetType.create({
      name: 'Dog',
      slug: 'dog',
      icon: '🐕',
      description: 'Everything for your dog',
      isActive: true,
      order: 1
    });

    const catPetType = await PetType.create({
      name: 'Cat',
      slug: 'cat',
      icon: '🐱',
      description: 'Everything for your cat',
      isActive: true,
      order: 2
    });

    const otherPetType = await PetType.create({
      name: 'Other Animals',
      slug: 'other-animals',
      icon: '🐾',
      description: 'Birds, Fish, Small Pets, Reptiles & More',
      isActive: true,
      order: 3
    });

    logger.info('Pet types created (3 total)');

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@petshiwu.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      phone: '555-0100'
    });

    if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
      logger.warn('⚠️  WARNING: Using default password for admin user in production!');
      logger.warn('   Please set ADMIN_PASSWORD environment variable and change the password immediately.');
    }

    // Create demo customer
    const customer = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer@example.com',
      password: process.env.DEMO_CUSTOMER_PASSWORD || 'password123',
      role: 'customer',
      phone: '555-0200'
    });

    logger.info('Users created');

    // ===== CREATE CATEGORIES FROM NAVIGATION MENU =====
    
    // Dog Categories from navigation menu
    const dogFood = await Category.create({
      name: 'Food',
      slug: 'dog-food',
      description: 'Premium dog food for all breeds and sizes',
      petType: 'dog',
      isActive: true,
      level: 1
    });

    // Dog Food Subcategories
    const dogFoodSubcategories = await Category.insertMany([
      { name: 'Dry Food', slug: 'dog-dry-food', petType: 'dog', parentCategory: dogFood._id, isActive: true, level: 2 },
      { name: 'Wet Food', slug: 'dog-wet-food', petType: 'dog', parentCategory: dogFood._id, isActive: true, level: 2 },
      { name: 'Fresh Food & Toppers', slug: 'dog-fresh-food-toppers', petType: 'dog', parentCategory: dogFood._id, isActive: true, level: 2 },
      { name: 'Veterinary Diets', slug: 'dog-veterinary-diets', petType: 'dog', parentCategory: dogFood._id, isActive: true, level: 2 },
      { name: 'Science-Backed Formulas', slug: 'dog-science-formulas', petType: 'dog', parentCategory: dogFood._id, isActive: true, level: 2 },
      { name: 'Puppy Food', slug: 'dog-puppy-food', petType: 'dog', parentCategory: dogFood._id, isActive: true, level: 2 }
    ]);

    const dogTreats = await Category.create({
      name: 'Treats',
      slug: 'dog-treats',
      description: 'Delicious treats and snacks for dogs',
      petType: 'dog',
      isActive: true,
      level: 1
    });

    // Dog Treats Subcategories
    await Category.insertMany([
      { name: 'Bones, Bully Sticks & Naturals', slug: 'dog-bones-bully-sticks', petType: 'dog', parentCategory: dogTreats._id, isActive: true, level: 2 },
      { name: 'Soft & Chewy Treats', slug: 'dog-soft-chewy-treats', petType: 'dog', parentCategory: dogTreats._id, isActive: true, level: 2 },
      { name: 'Dental Treats', slug: 'dog-dental-treats', petType: 'dog', parentCategory: dogTreats._id, isActive: true, level: 2 },
      { name: 'Biscuits & Cookies', slug: 'dog-biscuits-cookies', petType: 'dog', parentCategory: dogTreats._id, isActive: true, level: 2 },
      { name: 'Long-Lasting Chews', slug: 'dog-long-lasting-chews', petType: 'dog', parentCategory: dogTreats._id, isActive: true, level: 2 },
      { name: 'Jerky Treats', slug: 'dog-jerky-treats', petType: 'dog', parentCategory: dogTreats._id, isActive: true, level: 2 },
      { name: 'Freeze-Dried & Dehydrated', slug: 'dog-freeze-dried', petType: 'dog', parentCategory: dogTreats._id, isActive: true, level: 2 }
    ]);

    const dogHealth = await Category.create({
      name: 'Health & Pharmacy',
      slug: 'dog-health-pharmacy',
      description: 'Health products and medications for dogs',
      petType: 'dog',
      isActive: true,
      level: 1
    });

    // Dog Health Subcategories
    await Category.insertMany([
      { name: 'Flea & Tick', slug: 'dog-flea-tick', petType: 'dog', parentCategory: dogHealth._id, isActive: true, level: 2 },
      { name: 'Vitamins & Supplements', slug: 'dog-vitamins-supplements', petType: 'dog', parentCategory: dogHealth._id, isActive: true, level: 2 },
      { name: 'Allergy & Itch Relief', slug: 'dog-allergy-itch-relief', petType: 'dog', parentCategory: dogHealth._id, isActive: true, level: 2 },
      { name: 'Heartworm & Dewormers', slug: 'dog-heartworm-dewormers', petType: 'dog', parentCategory: dogHealth._id, isActive: true, level: 2 },
      { name: 'Pharmacy & Prescriptions', slug: 'dog-pharmacy-prescriptions', petType: 'dog', parentCategory: dogHealth._id, isActive: true, level: 2 },
      { name: 'Anxiety & Calming Care', slug: 'dog-anxiety-calming', petType: 'dog', parentCategory: dogHealth._id, isActive: true, level: 2 },
      { name: 'DNA Testing Kits', slug: 'dog-dna-testing', petType: 'dog', parentCategory: dogHealth._id, isActive: true, level: 2 }
    ]);

    const dogSupplies = await Category.create({
      name: 'Supplies',
      slug: 'dog-supplies',
      description: 'Essential supplies for dogs',
      petType: 'dog',
      isActive: true,
      level: 1
    });

    // Dog Supplies Subcategories
    await Category.insertMany([
      { name: 'Crates, Pens & Gates', slug: 'dog-crates-pens-gates', petType: 'dog', parentCategory: dogSupplies._id, isActive: true, level: 2 },
      { name: 'Beds', slug: 'dog-beds', petType: 'dog', parentCategory: dogSupplies._id, isActive: true, level: 2 },
      { name: 'Tech & Smart Home', slug: 'dog-tech-smart-home', petType: 'dog', parentCategory: dogSupplies._id, isActive: true, level: 2 },
      { name: 'Leashes, Collars & Harnesses', slug: 'dog-leashes-collars-harnesses', petType: 'dog', parentCategory: dogSupplies._id, isActive: true, level: 2 },
      { name: 'Bowls & Feeders', slug: 'dog-bowls-feeders', petType: 'dog', parentCategory: dogSupplies._id, isActive: true, level: 2 },
      { name: 'Clothing & Accessories', slug: 'dog-clothing-accessories', petType: 'dog', parentCategory: dogSupplies._id, isActive: true, level: 2 },
      { name: 'Carriers & Travel', slug: 'dog-carriers-travel', petType: 'dog', parentCategory: dogSupplies._id, isActive: true, level: 2 },
      { name: 'Training & Behavior', slug: 'dog-training-behavior', petType: 'dog', parentCategory: dogSupplies._id, isActive: true, level: 2 }
    ]);

    const dogToys = await Category.create({
      name: 'Toys',
      slug: 'dog-toys',
      description: 'Fun and durable toys for dogs',
      petType: 'dog',
      isActive: true,
      level: 1
    });

    // Dog Toys Subcategories
    await Category.insertMany([
      { name: 'Plush Toys', slug: 'dog-plush-toys', petType: 'dog', parentCategory: dogToys._id, isActive: true, level: 2 },
      { name: 'Chew Toys', slug: 'dog-chew-toys', petType: 'dog', parentCategory: dogToys._id, isActive: true, level: 2 },
      { name: 'Fetch Toys', slug: 'dog-fetch-toys', petType: 'dog', parentCategory: dogToys._id, isActive: true, level: 2 },
      { name: 'Treat Dispensing Toys', slug: 'dog-treat-dispensing-toys', petType: 'dog', parentCategory: dogToys._id, isActive: true, level: 2 },
      { name: 'Puzzle Toys', slug: 'dog-puzzle-toys', petType: 'dog', parentCategory: dogToys._id, isActive: true, level: 2 },
      { name: 'Rope & Tug Toys', slug: 'dog-rope-tug-toys', petType: 'dog', parentCategory: dogToys._id, isActive: true, level: 2 }
    ]);

    const dogCleaning = await Category.create({
      name: 'Cleaning & Potty',
      slug: 'dog-cleaning-potty',
      description: 'Cleaning and potty supplies for dogs',
      petType: 'dog',
      isActive: true,
      level: 1
    });

    // Dog Cleaning Subcategories
    await Category.insertMany([
      { name: 'Pee Pads & Diapers', slug: 'dog-pee-pads-diapers', petType: 'dog', parentCategory: dogCleaning._id, isActive: true, level: 2 },
      { name: 'Poop Bags & Scoopers', slug: 'dog-poop-bags-scoopers', petType: 'dog', parentCategory: dogCleaning._id, isActive: true, level: 2 },
      { name: 'Cleaners & Stain Removers', slug: 'dog-cleaners-stain-removers', petType: 'dog', parentCategory: dogCleaning._id, isActive: true, level: 2 },
      { name: 'Vacuums & Steam Cleaners', slug: 'dog-vacuums-steam-cleaners', petType: 'dog', parentCategory: dogCleaning._id, isActive: true, level: 2 }
    ]);

    const dogGrooming = await Category.create({
      name: 'Grooming',
      slug: 'dog-grooming',
      description: 'Grooming products for dogs',
      petType: 'dog',
      isActive: true,
      level: 1
    });

    // Dog Grooming Subcategories
    await Category.insertMany([
      { name: 'Brushes & Combs', slug: 'dog-brushes-combs', petType: 'dog', parentCategory: dogGrooming._id, isActive: true, level: 2 },
      { name: 'Shampoos & Conditioners', slug: 'dog-shampoos-conditioners', petType: 'dog', parentCategory: dogGrooming._id, isActive: true, level: 2 },
      { name: 'Grooming Tools', slug: 'dog-grooming-tools', petType: 'dog', parentCategory: dogGrooming._id, isActive: true, level: 2 },
      { name: 'Paw & Nail Care', slug: 'dog-paw-nail-care', petType: 'dog', parentCategory: dogGrooming._id, isActive: true, level: 2 },
      { name: 'Ear Care', slug: 'dog-ear-care', petType: 'dog', parentCategory: dogGrooming._id, isActive: true, level: 2 },
      { name: 'Skin Care', slug: 'dog-skin-care', petType: 'dog', parentCategory: dogGrooming._id, isActive: true, level: 2 }
    ]);

    // Cat Categories from navigation menu
    const catFood = await Category.create({
      name: 'Food',
      slug: 'cat-food',
      description: 'Nutritious cat food for all life stages',
      petType: 'cat',
      isActive: true,
      level: 1
    });

    // Cat Food Subcategories
    const catFoodSubcategories = await Category.insertMany([
      { name: 'Wet Food', slug: 'cat-wet-food', petType: 'cat', parentCategory: catFood._id, isActive: true, level: 2 },
      { name: 'Dry Food', slug: 'cat-dry-food', petType: 'cat', parentCategory: catFood._id, isActive: true, level: 2 },
      { name: 'Science-Backed Formulas', slug: 'cat-science-formulas', petType: 'cat', parentCategory: catFood._id, isActive: true, level: 2 },
      { name: 'Veterinary Diets', slug: 'cat-veterinary-diets', petType: 'cat', parentCategory: catFood._id, isActive: true, level: 2 },
      { name: 'Highest Quality Food', slug: 'cat-highest-quality-food', petType: 'cat', parentCategory: catFood._id, isActive: true, level: 2 },
      { name: 'Food Toppers', slug: 'cat-food-toppers', petType: 'cat', parentCategory: catFood._id, isActive: true, level: 2 },
      { name: 'Kitten Food', slug: 'cat-kitten-food', petType: 'cat', parentCategory: catFood._id, isActive: true, level: 2 }
    ]);

    const catLitter = await Category.create({
      name: 'Litter',
      slug: 'cat-litter',
      description: 'Litter and litter box accessories',
      petType: 'cat',
      isActive: true,
      level: 1
    });

    // Cat Litter Subcategories
    await Category.insertMany([
      { name: 'Clumping', slug: 'cat-litter-clumping', petType: 'cat', parentCategory: catLitter._id, isActive: true, level: 2 },
      { name: 'Scented', slug: 'cat-litter-scented', petType: 'cat', parentCategory: catLitter._id, isActive: true, level: 2 },
      { name: 'Unscented', slug: 'cat-litter-unscented', petType: 'cat', parentCategory: catLitter._id, isActive: true, level: 2 },
      { name: 'Natural', slug: 'cat-litter-natural', petType: 'cat', parentCategory: catLitter._id, isActive: true, level: 2 },
      { name: 'Lightweight', slug: 'cat-litter-lightweight', petType: 'cat', parentCategory: catLitter._id, isActive: true, level: 2 }
    ]);

    const catTreats = await Category.create({
      name: 'Treats',
      slug: 'cat-treats',
      description: 'Tasty treats for cats',
      petType: 'cat',
      isActive: true,
      level: 1
    });

    // Cat Treats Subcategories
    await Category.insertMany([
      { name: 'Crunchy Treats', slug: 'cat-crunchy-treats', petType: 'cat', parentCategory: catTreats._id, isActive: true, level: 2 },
      { name: 'Lickable Treats', slug: 'cat-lickable-treats', petType: 'cat', parentCategory: catTreats._id, isActive: true, level: 2 },
      { name: 'Soft & Chewy Treats', slug: 'cat-soft-chewy-treats', petType: 'cat', parentCategory: catTreats._id, isActive: true, level: 2 },
      { name: 'Dental Treats', slug: 'cat-dental-treats', petType: 'cat', parentCategory: catTreats._id, isActive: true, level: 2 },
      { name: 'Catnip', slug: 'cat-catnip', petType: 'cat', parentCategory: catTreats._id, isActive: true, level: 2 },
      { name: 'Cat Grass', slug: 'cat-cat-grass', petType: 'cat', parentCategory: catTreats._id, isActive: true, level: 2 }
    ]);

    const catSupplies = await Category.create({
      name: 'Supplies',
      slug: 'cat-supplies',
      description: 'Essential supplies for cats',
      petType: 'cat',
      isActive: true,
      level: 1
    });

    // Cat Supplies Subcategories
    await Category.insertMany([
      { name: 'Litter Boxes & Accessories', slug: 'cat-litter-boxes-accessories', petType: 'cat', parentCategory: catSupplies._id, isActive: true, level: 2 },
      { name: 'Tech & Smart Home', slug: 'cat-tech-smart-home', petType: 'cat', parentCategory: catSupplies._id, isActive: true, level: 2 },
      { name: 'Beds', slug: 'cat-beds', petType: 'cat', parentCategory: catSupplies._id, isActive: true, level: 2 },
      { name: 'Carriers & Travel', slug: 'cat-carriers-travel', petType: 'cat', parentCategory: catSupplies._id, isActive: true, level: 2 },
      { name: 'Bowls & Feeders', slug: 'cat-bowls-feeders', petType: 'cat', parentCategory: catSupplies._id, isActive: true, level: 2 },
      { name: 'Grooming', slug: 'cat-grooming-supplies', petType: 'cat', parentCategory: catSupplies._id, isActive: true, level: 2 },
      { name: 'Collars, Leashes & Harnesses', slug: 'cat-collars-leashes-harnesses', petType: 'cat', parentCategory: catSupplies._id, isActive: true, level: 2 }
    ]);

    const catHealth = await Category.create({
      name: 'Health & Pharmacy',
      slug: 'cat-health-pharmacy',
      description: 'Health products for cats',
      petType: 'cat',
      isActive: true,
      level: 1
    });

    // Cat Health Subcategories
    await Category.insertMany([
      { name: 'Flea & Tick', slug: 'cat-flea-tick', petType: 'cat', parentCategory: catHealth._id, isActive: true, level: 2 },
      { name: 'Vitamins & Supplements', slug: 'cat-vitamins-supplements', petType: 'cat', parentCategory: catHealth._id, isActive: true, level: 2 },
      { name: 'Allergy & Itch Relief', slug: 'cat-allergy-itch-relief', petType: 'cat', parentCategory: catHealth._id, isActive: true, level: 2 },
      { name: 'Pharmacy & Prescriptions', slug: 'cat-pharmacy-prescriptions', petType: 'cat', parentCategory: catHealth._id, isActive: true, level: 2 },
      { name: 'Anxiety & Calming Care', slug: 'cat-anxiety-calming', petType: 'cat', parentCategory: catHealth._id, isActive: true, level: 2 },
      { name: 'Urinary Tract & Kidneys', slug: 'cat-urinary-tract-kidneys', petType: 'cat', parentCategory: catHealth._id, isActive: true, level: 2 },
      { name: 'Test Kits', slug: 'cat-test-kits', petType: 'cat', parentCategory: catHealth._id, isActive: true, level: 2 }
    ]);

    const catTrees = await Category.create({
      name: 'Trees, Condos & Scratchers',
      slug: 'cat-trees-condos-scratchers',
      description: 'Cat trees, condos, and scratching posts',
      petType: 'cat',
      isActive: true,
      level: 1
    });

    // Cat Trees Subcategories
    await Category.insertMany([
      { name: 'Trees & Condos', slug: 'cat-trees-condos', petType: 'cat', parentCategory: catTrees._id, isActive: true, level: 2 },
      { name: 'Scratchers & Scratching Posts', slug: 'cat-scratchers-posts', petType: 'cat', parentCategory: catTrees._id, isActive: true, level: 2 },
      { name: 'Wall Shelves', slug: 'cat-wall-shelves', petType: 'cat', parentCategory: catTrees._id, isActive: true, level: 2 },
      { name: 'Window Perches', slug: 'cat-window-perches', petType: 'cat', parentCategory: catTrees._id, isActive: true, level: 2 }
    ]);

    const catToys = await Category.create({
      name: 'Toys',
      slug: 'cat-toys',
      description: 'Interactive toys for cats',
      petType: 'cat',
      isActive: true,
      level: 1
    });

    // Cat Toys Subcategories
    await Category.insertMany([
      { name: 'Interactive & Electronic Toys', slug: 'cat-interactive-electronic-toys', petType: 'cat', parentCategory: catToys._id, isActive: true, level: 2 },
      { name: 'Scratchers', slug: 'cat-toys-scratchers', petType: 'cat', parentCategory: catToys._id, isActive: true, level: 2 },
      { name: 'Teasers & Wands', slug: 'cat-teasers-wands', petType: 'cat', parentCategory: catToys._id, isActive: true, level: 2 },
      { name: 'Balls & Chasers', slug: 'cat-balls-chasers', petType: 'cat', parentCategory: catToys._id, isActive: true, level: 2 },
      { name: 'Catnip Toys', slug: 'cat-catnip-toys', petType: 'cat', parentCategory: catToys._id, isActive: true, level: 2 },
      { name: 'Plush & Mice Toys', slug: 'cat-plush-mice-toys', petType: 'cat', parentCategory: catToys._id, isActive: true, level: 2 }
    ]);

    const totalCategories = await Category.countDocuments();
    logger.info(`Categories created (${totalCategories} total - includes main categories and subcategories)`);

    // ===== CREATE PRODUCTS =====
    
    const products = [
      // DOG FOOD
      {
        name: 'Premium Dry Dog Food - Chicken & Rice',
        slug: 'premium-dry-dog-food-chicken-rice',
        description: 'High-quality dry dog food made with real chicken and wholesome rice. Perfect for adult dogs of all breeds. Contains essential nutrients, vitamins, and minerals for optimal health. Supports healthy digestion and maintains ideal weight.',
        shortDescription: 'Premium chicken & rice formula for adult dogs',
        brand: 'PawPremium',
        category: dogFoodSubcategories[0]._id, // Dry Food subcategory
        images: ['https://via.placeholder.com/500x500?text=Dog+Food+1'],
        variants: [
          { size: '5 lbs', price: 24.99, compareAtPrice: 29.99, stock: 50, sku: 'DF-CR-5LB' },
          { size: '15 lbs', price: 49.99, compareAtPrice: 59.99, stock: 30, sku: 'DF-CR-15LB' },
          { size: '30 lbs', price: 79.99, compareAtPrice: 99.99, stock: 20, sku: 'DF-CR-30LB' }
        ],
        basePrice: 24.99,
        compareAtPrice: 29.99,
        petType: 'dog',
        tags: ['dry food', 'chicken', 'adult', 'premium'],
        features: ['Real chicken as #1 ingredient', 'No artificial preservatives', 'Rich in protein', 'Supports healthy skin and coat'],
        ingredients: 'Chicken, Rice, Barley, Chicken Fat, Natural Flavors, Vitamins & Minerals',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10
      },
      {
        name: 'Grain-Free Puppy Food - Lamb & Sweet Potato',
        slug: 'grain-free-puppy-food-lamb-sweet-potato',
        description: 'Grain-free puppy food with lamb and sweet potato. Formulated specifically for growing puppies with DHA for brain development and balanced nutrition for healthy growth.',
        shortDescription: 'Grain-free formula for growing puppies',
        brand: 'PuppyPower',
        category: dogFoodSubcategories[5]._id, // Puppy Food subcategory
        images: ['https://via.placeholder.com/500x500?text=Dog+Food+2'],
        variants: [
          { size: '4 lbs', price: 22.99, compareAtPrice: 27.99, stock: 45, sku: 'PF-LSP-4LB' },
          { size: '12 lbs', price: 54.99, compareAtPrice: 64.99, stock: 28, sku: 'PF-LSP-12LB' }
        ],
        basePrice: 22.99,
        compareAtPrice: 27.99,
        petType: 'dog',
        tags: ['grain-free', 'puppy', 'lamb', 'sweet potato'],
        features: ['DHA for brain development', 'Grain-free formula', 'Small kibble size', 'Easy to digest'],
        ingredients: 'Lamb, Sweet Potatoes, Peas, Lamb Meal, Natural Flavors, DHA, Vitamins',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10
      },
      {
        name: 'Wet Dog Food - Beef Stew',
        slug: 'wet-dog-food-beef-stew',
        description: 'Premium wet dog food with real beef chunks in a savory gravy. High moisture content helps keep dogs hydrated. Perfect as a meal or topper.',
        shortDescription: 'Premium wet food with real beef chunks',
        brand: 'CanineCuisine',
        category: dogFoodSubcategories[1]._id, // Wet Food subcategory
        images: ['https://via.placeholder.com/500x500?text=Dog+Food+3'],
        variants: [
          { size: '12.5 oz (12 pack)', price: 34.99, compareAtPrice: 42.99, stock: 60, sku: 'WF-BS-12PK' },
          { size: '12.5 oz (24 pack)', price: 64.99, compareAtPrice: 79.99, stock: 40, sku: 'WF-BS-24PK' }
        ],
        basePrice: 34.99,
        compareAtPrice: 42.99,
        petType: 'dog',
        tags: ['wet food', 'beef', 'gravy', 'high moisture'],
        features: ['Real beef chunks', 'High moisture content', 'No fillers', 'Complete nutrition'],
        ingredients: 'Beef, Water, Carrots, Peas, Rice, Natural Flavors, Vitamins',
        isActive: true,
        isFeatured: false,
        autoshipEligible: true,
        autoshipDiscount: 5
      },

      // DOG TREATS
      {
        name: 'Puppy Training Treats - Chicken Flavor',
        slug: 'puppy-training-treats-chicken',
        description: 'Soft, bite-sized training treats perfect for puppies. Made with real chicken and designed to be low in calories. Ideal for positive reinforcement training.',
        shortDescription: 'Soft training treats for puppies',
        brand: 'PawPremium',
        category: dogTreats._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Treats+1'],
        variants: [
          { size: '6 oz', price: 7.99, stock: 200, sku: 'TREAT-PT-6OZ' },
          { size: '16 oz', price: 14.99, stock: 150, sku: 'TREAT-PT-16OZ' }
        ],
        basePrice: 7.99,
        petType: 'dog',
        tags: ['treats', 'training', 'puppy', 'chicken'],
        features: ['Real chicken', 'Low calorie', 'Soft texture', 'Perfect for training'],
        ingredients: 'Chicken, Wheat Flour, Vegetable Glycerin, Natural Flavors, Vitamins',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 5
      },
      {
        name: 'Dental Chew Bones - Large',
        slug: 'dental-chew-bones-large',
        description: 'Hard dental chews that help clean teeth and freshen breath. Made with natural ingredients and designed to last. Promotes dental health through chewing action.',
        shortDescription: 'Dental chews for teeth cleaning',
        brand: 'Dentasticks',
        category: dogTreats._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Treats+2'],
        variants: [
          { size: '8 count', price: 12.99, stock: 120, sku: 'DCB-L-8' },
          { size: '16 count', price: 22.99, stock: 90, sku: 'DCB-L-16' }
        ],
        basePrice: 12.99,
        petType: 'dog',
        tags: ['dental', 'chews', 'bones', 'teeth cleaning'],
        features: ['Cleans teeth', 'Freshens breath', 'Long-lasting', 'Natural ingredients'],
        ingredients: 'Wheat Flour, Rice Flour, Glycerin, Natural Flavors, Sodium Tripolyphosphate',
        isActive: true,
        isFeatured: false,
        autoshipEligible: true,
        autoshipDiscount: 5
      },

      // DOG TOYS
      {
        name: 'Durable Rope Tug Toy',
        slug: 'durable-rope-tug-toy',
        description: 'Heavy-duty rope toy perfect for tugging and interactive play. Made from durable cotton fibers that help clean teeth during play. Great for medium to large dogs.',
        shortDescription: 'Durable rope toy for interactive play',
        brand: 'PlayPup',
        category: dogToys._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Toy+1'],
        variants: [
          { size: 'Medium', price: 12.99, stock: 100, sku: 'TOY-RT-M' },
          { size: 'Large', price: 16.99, stock: 75, sku: 'TOY-RT-L' }
        ],
        basePrice: 12.99,
        petType: 'dog',
        tags: ['toy', 'rope', 'tug', 'interactive'],
        features: ['Durable cotton rope', 'Teeth cleaning action', 'Interactive play', 'Machine washable'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false
      },
      {
        name: 'Interactive Puzzle Feeder',
        slug: 'interactive-puzzle-feeder',
        description: 'Mental stimulation toy that makes mealtime fun. Slow-feeding design prevents gulping and promotes healthy eating habits. Adjustable difficulty levels.',
        shortDescription: 'Puzzle feeder for mental stimulation',
        brand: 'BrainyBites',
        category: dogToys._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Toy+2'],
        variants: [
          { size: 'Medium', price: 24.99, stock: 85, sku: 'TOY-PF-M' },
          { size: 'Large', price: 29.99, stock: 60, sku: 'TOY-PF-L' }
        ],
        basePrice: 24.99,
        petType: 'dog',
        tags: ['puzzle', 'feeder', 'interactive', 'slow feed'],
        features: ['Mental stimulation', 'Slow feeding', 'Adjustable difficulty', 'Dishwasher safe'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false
      },
      {
        name: 'Indestructible Ball - Tennis Style',
        slug: 'indestructible-ball-tennis',
        description: 'Ultra-durable ball designed for heavy chewers. Made from tough rubber material that resists punctures and tears. Perfect for fetch and play.',
        shortDescription: 'Durable ball for heavy chewers',
        brand: 'ToughPup',
        category: dogToys._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Toy+3'],
        variants: [
          { size: 'Standard', price: 9.99, stock: 150, sku: 'TOY-BALL-STD' },
          { size: 'Large', price: 14.99, stock: 100, sku: 'TOY-BALL-L' }
        ],
        basePrice: 9.99,
        petType: 'dog',
        tags: ['ball', 'fetch', 'durable', 'tennis'],
        features: ['Ultra-durable', 'Puncture resistant', 'Bounces well', 'Easy to clean'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false
      },

      // DOG HEALTH
      {
        name: 'Flea & Tick Prevention - Monthly Treatment',
        slug: 'flea-tick-prevention-monthly',
        description: 'Topical flea and tick prevention that lasts up to 30 days. Kills fleas, ticks, and chewing lice. Waterproof formula stays effective even after bathing.',
        shortDescription: 'Monthly flea and tick prevention',
        brand: 'PetGuard',
        category: dogHealth._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Health+1'],
        variants: [
          { size: 'Small (5-22 lbs)', price: 24.99, stock: 80, sku: 'FT-SM' },
          { size: 'Medium (23-44 lbs)', price: 29.99, stock: 75, sku: 'FT-MD' },
          { size: 'Large (45-88 lbs)', price: 34.99, stock: 70, sku: 'FT-LG' },
          { size: 'Extra Large (89+ lbs)', price: 39.99, stock: 65, sku: 'FT-XL' }
        ],
        basePrice: 24.99,
        petType: 'dog',
        tags: ['flea', 'tick', 'prevention', 'monthly'],
        features: ['30-day protection', 'Waterproof', 'Kills fleas and ticks', 'Easy to apply'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 15
      },

      // DOG SUPPLIES
      {
        name: 'Adjustable Dog Harness - Reflective',
        slug: 'adjustable-dog-harness-reflective',
        description: 'Comfortable no-pull harness with reflective strips for safety. Adjustable straps fit multiple sizes. Front and back attachment points for training.',
        shortDescription: 'No-pull harness with reflective strips',
        brand: 'WalkSafe',
        category: dogSupplies._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Supply+1'],
        variants: [
          { size: 'Small', price: 19.99, stock: 95, sku: 'HARN-S' },
          { size: 'Medium', price: 24.99, stock: 85, sku: 'HARN-M' },
          { size: 'Large', price: 29.99, stock: 75, sku: 'HARN-L' },
          { size: 'Extra Large', price: 34.99, stock: 65, sku: 'HARN-XL' }
        ],
        basePrice: 19.99,
        petType: 'dog',
        tags: ['harness', 'walking', 'reflective', 'no-pull'],
        features: ['No-pull design', 'Reflective strips', 'Adjustable', 'Comfortable padding'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false
      },

      // DOG GROOMING
      {
        name: 'Deshedding Brush - Double Sided',
        slug: 'deshedding-brush-double-sided',
        description: 'Professional deshedding tool with two sides - one for removing loose hair and undercoat, another for finishing. Reduces shedding by up to 90%.',
        shortDescription: 'Double-sided deshedding brush',
        brand: 'ShedBuster',
        category: dogGrooming._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Grooming+1'],
        variants: [
          { size: 'Medium', price: 16.99, stock: 110, sku: 'BRUSH-M' },
          { size: 'Large', price: 19.99, stock: 90, sku: 'BRUSH-L' }
        ],
        basePrice: 16.99,
        petType: 'dog',
        tags: ['brush', 'deshedding', 'grooming', 'shedding'],
        features: ['Reduces shedding 90%', 'Dual-sided design', 'Ergonomic handle', 'Safe for all coats'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false
      },

      // CAT FOOD
      {
        name: 'Grain-Free Cat Food - Salmon Formula',
        slug: 'grain-free-cat-food-salmon',
        description: 'Grain-free cat food with real salmon as the first ingredient. Specially formulated for adult cats with sensitive stomachs. Rich in omega-3 and omega-6 fatty acids.',
        shortDescription: 'Grain-free salmon formula for cats',
        brand: 'FelineFresh',
        category: catFoodSubcategories[1]._id, // Dry Food subcategory
        images: ['https://via.placeholder.com/500x500?text=Cat+Food+1'],
        variants: [
          { size: '3 lbs', price: 19.99, compareAtPrice: 24.99, stock: 40, sku: 'CF-SF-3LB' },
          { size: '7 lbs', price: 34.99, compareAtPrice: 42.99, stock: 35, sku: 'CF-SF-7LB' },
          { size: '14 lbs', price: 59.99, compareAtPrice: 74.99, stock: 25, sku: 'CF-SF-14LB' }
        ],
        basePrice: 19.99,
        compareAtPrice: 24.99,
        petType: 'cat',
        tags: ['grain-free', 'salmon', 'adult', 'sensitive stomach'],
        features: ['Real salmon #1 ingredient', 'Grain-free formula', 'High in protein', 'Omega fatty acids'],
        ingredients: 'Salmon, Sweet Potatoes, Peas, Salmon Meal, Natural Flavors, Vitamins & Minerals',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10
      },
      {
        name: 'Wet Cat Food - Chicken Pate (Variety Pack)',
        slug: 'wet-cat-food-chicken-pate-variety',
        description: 'Premium wet cat food in smooth pate texture. Variety pack includes chicken, turkey, and fish flavors. High moisture content supports urinary health.',
        shortDescription: 'Wet food variety pack in pate texture',
        brand: 'FelineFresh',
        category: catFoodSubcategories[0]._id, // Wet Food subcategory
        images: ['https://via.placeholder.com/500x500?text=Cat+Food+2'],
        variants: [
          { size: '3 oz (24 pack)', price: 28.99, compareAtPrice: 34.99, stock: 50, sku: 'CF-VP-24' },
          { size: '3 oz (48 pack)', price: 52.99, compareAtPrice: 64.99, stock: 35, sku: 'CF-VP-48' }
        ],
        basePrice: 28.99,
        compareAtPrice: 34.99,
        petType: 'cat',
        tags: ['wet food', 'pate', 'variety', 'high moisture'],
        features: ['Smooth pate texture', 'Variety of flavors', 'High moisture', 'Complete nutrition'],
        ingredients: 'Chicken, Water, Liver, Natural Flavors, Vitamins & Minerals',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10
      },

      // CAT TREATS
      {
        name: 'Crunchy Cat Treats - Tuna Flavor',
        slug: 'crunchy-cat-treats-tuna',
        description: 'Crunchy baked treats with real tuna. Helps maintain dental health through chewing action. Low calorie - perfect for training or rewards.',
        shortDescription: 'Crunchy tuna-flavored treats',
        brand: 'KittySnacks',
        category: catTreats._id,
        images: ['https://via.placeholder.com/500x500?text=Cat+Treats+1'],
        variants: [
          { size: '2.5 oz', price: 4.99, stock: 180, sku: 'CT-TU-2.5' },
          { size: '6 oz', price: 9.99, stock: 140, sku: 'CT-TU-6' }
        ],
        basePrice: 4.99,
        petType: 'cat',
        tags: ['treats', 'crunchy', 'tuna', 'dental'],
        features: ['Real tuna', 'Dental health', 'Low calorie', 'Crunchy texture'],
        ingredients: 'Tuna, Rice Flour, Wheat Flour, Natural Flavors, Vitamins',
        isActive: true,
        isFeatured: false,
        autoshipEligible: true,
        autoshipDiscount: 5
      },

      // CAT TOYS
      {
        name: 'Interactive Feather Wand',
        slug: 'interactive-feather-wand',
        description: 'Exciting feather wand toy that engages your cat\'s natural hunting instincts. Features colorful feathers and a flexible wand for dynamic play. Hours of entertainment guaranteed!',
        shortDescription: 'Feather wand for interactive cat play',
        brand: 'KittyPlay',
        category: catToys._id,
        images: ['https://via.placeholder.com/500x500?text=Cat+Toy+1'],
        variants: [
          { size: 'Standard', price: 8.99, stock: 150, sku: 'TOY-FW-STD' }
        ],
        basePrice: 8.99,
        petType: 'cat',
        tags: ['toy', 'feather', 'interactive', 'wand'],
        features: ['Natural feathers', 'Flexible wand', 'Engages hunting instincts', 'Encourages exercise'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false
      },
      {
        name: 'Catnip-Infused Mouse Toy (3 Pack)',
        slug: 'catnip-mouse-toy-3pack',
        description: 'Realistic mouse toys filled with premium catnip. Encourages natural hunting and play behavior. Machine washable and refillable with catnip.',
        shortDescription: 'Catnip-filled mouse toys',
        brand: 'KittyPlay',
        category: catToys._id,
        images: ['https://via.placeholder.com/500x500?text=Cat+Toy+2'],
        variants: [
          { size: '3 Pack', price: 12.99, stock: 130, sku: 'TOY-MOUSE-3' }
        ],
        basePrice: 12.99,
        petType: 'cat',
        tags: ['toy', 'catnip', 'mouse', 'interactive'],
        features: ['Premium catnip', 'Realistic design', 'Machine washable', 'Refillable'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false
      },
      {
        name: 'Automatic Laser Toy',
        slug: 'automatic-laser-toy',
        description: 'Interactive laser toy that moves automatically. Multiple pattern modes keep cats engaged. Auto-shutoff after 15 minutes for safety. Perfect for exercise.',
        shortDescription: 'Automatic laser toy for cats',
        brand: 'TechKitty',
        category: catToys._id,
        images: ['https://via.placeholder.com/500x500?text=Cat+Toy+3'],
        variants: [
          { size: 'Standard', price: 34.99, stock: 70, sku: 'TOY-LASER-AUTO' }
        ],
        basePrice: 34.99,
        petType: 'cat',
        tags: ['laser', 'automatic', 'interactive', 'exercise'],
        features: ['Multiple patterns', 'Auto-shutoff', 'Battery powered', 'Safe laser'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false
      },

      // CAT HEALTH
      {
        name: 'Cat Flea & Tick Prevention - Topical',
        slug: 'cat-flea-tick-prevention-topical',
        description: 'Monthly topical flea and tick prevention for cats. Kills fleas and ticks for up to 30 days. Waterproof and fast-acting.',
        shortDescription: 'Monthly flea and tick prevention',
        brand: 'PetGuard',
        category: catHealth._id,
        images: ['https://via.placeholder.com/500x500?text=Cat+Health+1'],
        variants: [
          { size: '5-9 lbs (3 pack)', price: 32.99, stock: 75, sku: 'FT-CAT-S' },
          { size: '9+ lbs (3 pack)', price: 37.99, stock: 70, sku: 'FT-CAT-L' }
        ],
        basePrice: 32.99,
        petType: 'cat',
        tags: ['flea', 'tick', 'prevention', 'monthly'],
        features: ['30-day protection', 'Waterproof', 'Kills fleas and ticks', 'Easy application'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 15
      },

      // CAT LITTER
      {
        name: 'Clumping Cat Litter - Unscented',
        slug: 'clumping-cat-litter-unscented',
        description: 'Premium clumping cat litter with odor control. Forms tight clumps for easy scooping. Low dust formula. Unscented for sensitive noses.',
        shortDescription: 'Premium clumping litter',
        brand: 'FreshPaws',
        category: catLitter._id,
        images: ['https://via.placeholder.com/500x500?text=Cat+Litter+1'],
        variants: [
          { size: '20 lbs', price: 18.99, stock: 100, sku: 'LITTER-20' },
          { size: '40 lbs', price: 32.99, stock: 80, sku: 'LITTER-40' }
        ],
        basePrice: 18.99,
        petType: 'cat',
        tags: ['litter', 'clumping', 'unscented', 'odor control'],
        features: ['Tight clumping', 'Odor control', 'Low dust', 'Unscented'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: true,
        autoshipDiscount: 10
      },

      // CAT GROOMING
      {
        name: 'Self-Cleaning Slicker Brush',
        slug: 'self-cleaning-slicker-brush',
        description: 'Professional slicker brush with self-cleaning button. Removes loose hair and prevents matting. Retractable pins for easy cleaning.',
        shortDescription: 'Self-cleaning slicker brush',
        brand: 'GroomPro',
        category: catSupplies._id, // Grooming is now under Supplies for cats
        images: ['https://via.placeholder.com/500x500?text=Cat+Grooming+1'],
        variants: [
          { size: 'Standard', price: 14.99, stock: 120, sku: 'BRUSH-SLICKER' }
        ],
        basePrice: 14.99,
        petType: 'cat',
        tags: ['brush', 'slicker', 'grooming', 'self-cleaning'],
        features: ['Self-cleaning button', 'Prevents matting', 'Removes loose hair', 'Ergonomic handle'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false
      }
    ];

    await Product.insertMany(products);

    logger.info('Products created (20 total)');
    logger.info('\n=== Seed Data Summary ===');
    logger.info('Admin User:');
    logger.info('  Email: admin@petshiwu.com');
    logger.info('\nCustomer User:');
    logger.info('  Email: customer@example.com');
    logger.info('\nPet Types: 3');
    logger.info('  - Dog 🐕');
    logger.info('  - Cat 🐱');
    logger.info('  - Other Animals 🐾');
    const mainCategoriesCount = await Category.countDocuments({ level: 1 });
    const subcategoriesCount = await Category.countDocuments({ level: 2 });
    logger.info(`\nCategories: ${totalCategories} total`);
    logger.info(`  - Main Categories (Level 1): ${mainCategoriesCount}`);
    logger.info(`  - Subcategories (Level 2): ${subcategoriesCount}`);
    logger.info('  - Dog: Food (6 subcategories), Treats (7), Health & Pharmacy (7), Supplies (8), Toys (6), Cleaning & Potty (4), Grooming (6)');
    logger.info('  - Cat: Food (7 subcategories), Litter (5), Treats (6), Supplies (7), Health & Pharmacy (7), Trees/Condos/Scratchers (4), Toys (6)');
    logger.info('\nProducts: 20');
    logger.info('  - Dog Products: 10');
    logger.info('  - Cat Products: 10');
    logger.info('\n=== Seeding Complete ===');
    logger.info('\n✅ Navigation menu will now display Dog, Cat, and Other Animals');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
