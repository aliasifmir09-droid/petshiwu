import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import PetType from '../models/PetType';
import mongoose from 'mongoose';

dotenv.config();

const seedProducts = async () => {
  try {
    // PRODUCTION PROTECTION: Prevent accidental data deletion
    const isProduction = process.env.NODE_ENV === 'production';
    const forceSeed = process.env.FORCE_SEED === 'true';
    
    if (isProduction && !forceSeed) {
      console.error('\n❌❌❌ PRODUCTION SEED BLOCKED ❌❌❌\n');
      console.error('⚠️  WARNING: Seed script is blocked in production to prevent data loss!');
      console.error('   This script will DELETE ALL existing products and categories.\n');
      console.error('   To run in production, you MUST set:');
      console.error('   FORCE_SEED=true\n');
      console.error('   Example:');
      console.error('   FORCE_SEED=true npm run seed-products\n');
      console.error('   ⚠️  This is a DESTRUCTIVE operation. Use with extreme caution!\n');
      process.exit(1);
    }

    if (isProduction && forceSeed) {
      console.warn('\n⚠️⚠️⚠️  PRODUCTION SEED MODE ⚠️⚠️⚠️\n');
      console.warn('⚠️  WARNING: You are about to DELETE ALL products and categories!');
      console.warn('   Users and Pet Types will be preserved.\n');
      console.warn('   Waiting 5 seconds before proceeding...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    await connectDatabase();

    // Count existing data before deletion
    const productCount = await Product.countDocuments({});
    const categoryCount = await Category.countDocuments({});

    console.log('\n📊 Current Database State:');
    console.log(`   Products: ${productCount}`);
    console.log(`   Categories: ${categoryCount}\n`);

    if (isProduction && forceSeed) {
      console.warn('⚠️  PROCEEDING WITH DELETION IN 3 SECONDS...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('🌱 Starting comprehensive product seeding...\n');

    // Clear existing products (but keep users and pet types)
    await Product.deleteMany({});
    await Category.deleteMany({});

    console.log('✅ Existing products and categories cleared\n');

    // Verify pet types exist
    const petTypes = await PetType.find();
    console.log(`📦 Found ${petTypes.length} pet types\n`);

    // ==================== DOG CATEGORIES ====================
    console.log('Creating Dog categories...');
    
    const dogFoodCategory = await Category.create({
      name: 'Dog Food',
      slug: 'dog-food',
      description: 'Premium dog food for all breeds and life stages',
      petType: 'dog',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop&q=90'
    });

    const dogTreatsCategory = await Category.create({
      name: 'Dog Treats',
      slug: 'dog-treats',
      description: 'Delicious and healthy treats for your dog',
      petType: 'dog',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop&q=90'
    });

    const dogToysCategory = await Category.create({
      name: 'Dog Toys',
      slug: 'dog-toys',
      description: 'Fun and durable toys for dogs of all sizes',
      petType: 'dog',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=400&h=400&fit=crop&q=90'
    });

    const dogSuppliesCategory = await Category.create({
      name: 'Dog Supplies',
      slug: 'dog-supplies',
      description: 'Essential supplies for your dog',
      petType: 'dog',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop&q=90'
    });

    const dogHealthCategory = await Category.create({
      name: 'Dog Health & Wellness',
      slug: 'dog-health-wellness',
      description: 'Health products and supplements for dogs',
      petType: 'dog',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop&q=90'
    });

    // ==================== CAT CATEGORIES ====================
    console.log('Creating Cat categories...');
    
    const catFoodCategory = await Category.create({
      name: 'Cat Food',
      slug: 'cat-food',
      description: 'Nutritious food for cats of all ages',
      petType: 'cat',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=400&h=400&fit=crop&q=90'
    });

    const catTreatsCategory = await Category.create({
      name: 'Cat Treats',
      slug: 'cat-treats',
      description: 'Tasty treats your cat will love',
      petType: 'cat',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1548280899-d9e55f2e8c7b?w=400&h=400&fit=crop&q=90'
    });

    const catToysCategory = await Category.create({
      name: 'Cat Toys',
      slug: 'cat-toys',
      description: 'Interactive and engaging toys for cats',
      petType: 'cat',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400&h=400&fit=crop&q=90'
    });

    const catLitterCategory = await Category.create({
      name: 'Cat Litter',
      slug: 'cat-litter',
      description: 'Quality litter for a clean home',
      petType: 'cat',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=400&h=400&fit=crop&q=90'
    });

    const catSuppliesCategory = await Category.create({
      name: 'Cat Supplies',
      slug: 'cat-supplies',
      description: 'Essential supplies for your feline friend',
      petType: 'cat',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1516750931-78a5b16a4014?w=400&h=400&fit=crop&q=90'
    });

    console.log('✅ Categories created\n');

    // ==================== DOG PRODUCTS ====================
    console.log('Creating Dog products...');
    
    const dogProducts = [
      // DOG FOOD
      {
        name: 'Premium Dry Dog Food - Chicken & Rice',
        description: 'High-quality dry dog food made with real chicken and wholesome rice. Perfect for adult dogs of all breeds. Contains essential nutrients, vitamins, and minerals for optimal health. No artificial flavors or preservatives.',
        shortDescription: 'Premium chicken & rice formula for adult dogs',
        brand: 'PawPremium',
        category: dogFoodCategory._id,
        images: [
          'https://images.pexels.com/photos/1564506/pexels-photo-1564506.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1',
          'https://images.pexels.com/photos/7210754/pexels-photo-7210754.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1',
          'https://images.pexels.com/photos/1390361/pexels-photo-1390361.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1'
        ],
        variants: [
          { size: '5 lbs', price: 24.99, compareAtPrice: 29.99, stock: 50, sku: 'DF-CR-5LB-001' },
          { size: '15 lbs', price: 49.99, compareAtPrice: 59.99, stock: 30, sku: 'DF-CR-15LB-001' },
          { size: '30 lbs', price: 79.99, compareAtPrice: 99.99, stock: 20, sku: 'DF-CR-30LB-001' }
        ],
        basePrice: 24.99,
        compareAtPrice: 29.99,
        petType: 'dog',
        tags: ['dry food', 'chicken', 'adult', 'premium', 'grain-inclusive'],
        features: ['Real chicken as #1 ingredient', 'No artificial preservatives', 'Rich in protein', 'Supports healthy skin and coat', 'Complete and balanced nutrition'],
        ingredients: 'Chicken, Rice, Barley, Chicken Fat, Natural Flavors, Vitamins & Minerals',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10,
        averageRating: 4.7,
        totalReviews: 342
      },
      {
        name: 'Grain-Free Dog Food - Beef & Sweet Potato',
        description: 'Grain-free formula with real beef and nutrient-rich sweet potatoes. Ideal for dogs with grain sensitivities. High protein content supports lean muscle mass and provides sustained energy.',
        shortDescription: 'Grain-free beef & sweet potato formula',
        brand: 'WildPaws',
        category: dogFoodCategory._id,
        images: [
          'https://images.pexels.com/photos/7210754/pexels-photo-7210754.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1',
          'https://images.pexels.com/photos/5731881/pexels-photo-5731881.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1'
        ],
        variants: [
          { size: '4 lbs', price: 29.99, compareAtPrice: 34.99, stock: 40, sku: 'DF-BSP-4LB-001' },
          { size: '12 lbs', price: 64.99, compareAtPrice: 74.99, stock: 25, sku: 'DF-BSP-12LB-001' },
          { size: '24 lbs', price: 99.99, compareAtPrice: 119.99, stock: 15, sku: 'DF-BSP-24LB-001' }
        ],
        basePrice: 29.99,
        compareAtPrice: 34.99,
        petType: 'dog',
        tags: ['grain-free', 'beef', 'sweet potato', 'high protein'],
        features: ['Real beef #1 ingredient', 'Grain-free formula', 'Sweet potatoes for energy', 'No corn, wheat, or soy', 'Rich in omega fatty acids'],
        ingredients: 'Beef, Sweet Potatoes, Peas, Beef Meal, Chicken Fat, Natural Flavors, Vitamins & Minerals',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10,
        averageRating: 4.8,
        totalReviews: 289
      },
      {
        name: 'Puppy Food - Chicken & Brown Rice',
        description: 'Specially formulated for growing puppies. Packed with DHA for brain development, calcium for strong bones, and high-quality protein for muscle growth. Perfect for puppies up to 12 months.',
        shortDescription: 'Complete nutrition for growing puppies',
        brand: 'PawPremium',
        category: dogFoodCategory._id,
        images: [
          'https://images.unsplash.com/photo-1563460716037-460a3ad24ba9?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '5 lbs', price: 27.99, stock: 45, sku: 'PF-CBR-5LB-001' },
          { size: '15 lbs', price: 54.99, stock: 30, sku: 'PF-CBR-15LB-001' }
        ],
        basePrice: 27.99,
        petType: 'dog',
        tags: ['puppy', 'chicken', 'brown rice', 'growth formula'],
        features: ['DHA for brain development', 'Calcium for strong bones', 'High protein content', 'Easy to digest', 'Veterinarian recommended'],
        ingredients: 'Chicken, Brown Rice, Chicken Meal, Fish Oil, Vitamins & Minerals',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10,
        averageRating: 4.9,
        totalReviews: 412
      },
      {
        name: 'Senior Dog Food - Lamb & Rice',
        description: 'Tailored nutrition for senior dogs 7+ years. Lower calories to maintain healthy weight, glucosamine for joint health, and easily digestible ingredients for aging digestive systems.',
        shortDescription: 'Gentle nutrition for senior dogs',
        brand: 'GoldenYears',
        category: dogFoodCategory._id,
        images: [
          'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '6 lbs', price: 32.99, stock: 35, sku: 'SF-LR-6LB-001' },
          { size: '14 lbs', price: 59.99, stock: 20, sku: 'SF-LR-14LB-001' }
        ],
        basePrice: 32.99,
        petType: 'dog',
        tags: ['senior', 'lamb', 'rice', 'joint support'],
        features: ['Glucosamine & chondroitin for joints', 'Lower calorie formula', 'Easy to digest', 'Antioxidants for immunity', 'Omega fatty acids for coat health'],
        ingredients: 'Lamb, Rice, Barley, Chicken Fat, Glucosamine, Chondroitin, Vitamins & Minerals',
        isActive: true,
        isFeatured: false,
        autoshipEligible: true,
        autoshipDiscount: 10,
        averageRating: 4.6,
        totalReviews: 156
      },

      // DOG TREATS
      {
        name: 'Training Treats - Chicken Flavor',
        description: 'Soft, bite-sized training treats perfect for positive reinforcement. Made with real chicken and low in calories. Ideal size for frequent rewarding during training sessions.',
        shortDescription: 'Soft training treats for all dogs',
        brand: 'PawPremium',
        category: dogTreatsCategory._id,
        images: [
          'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '6 oz', price: 7.99, stock: 200, sku: 'DT-TC-6OZ-001' },
          { size: '16 oz', price: 14.99, stock: 150, sku: 'DT-TC-16OZ-001' }
        ],
        basePrice: 7.99,
        petType: 'dog',
        tags: ['treats', 'training', 'chicken', 'soft'],
        features: ['Real chicken', 'Low calorie', 'Soft texture', 'Perfect for training', 'No artificial colors'],
        ingredients: 'Chicken, Wheat Flour, Vegetable Glycerin, Natural Flavors, Vitamins',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 5,
        averageRating: 4.8,
        totalReviews: 523
      },
      {
        name: 'Dental Chew Sticks - Mint Flavor',
        description: 'Long-lasting dental chews that help reduce plaque and tartar buildup. Infused with mint for fresh breath. Ridged texture cleans teeth while your dog chews. Veterinarian recommended.',
        shortDescription: 'Dental chews for cleaner teeth',
        brand: 'DentaPaws',
        category: dogTreatsCategory._id,
        images: [
          'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Small (10 count)', price: 12.99, stock: 80, sku: 'DT-DC-SM-001' },
          { size: 'Medium (10 count)', price: 15.99, stock: 70, sku: 'DT-DC-MD-001' },
          { size: 'Large (10 count)', price: 18.99, stock: 60, sku: 'DT-DC-LG-001' }
        ],
        basePrice: 12.99,
        petType: 'dog',
        tags: ['dental', 'chew', 'mint', 'oral health'],
        features: ['Reduces plaque & tartar', 'Freshens breath', 'Long-lasting', 'Easy to digest', 'Vet recommended'],
        ingredients: 'Rice Flour, Glycerin, Chicken, Mint Extract, Calcium Carbonate',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10,
        averageRating: 4.7,
        totalReviews: 387
      },
      {
        name: 'Bully Sticks - 6 Inch Natural',
        description: 'All-natural, single-ingredient bully sticks. 100% beef pizzle with no chemicals, hormones, or preservatives. Long-lasting chew that keeps dogs engaged and satisfies natural chewing instincts.',
        shortDescription: 'All-natural beef pizzle chews',
        brand: 'NaturalChews',
        category: dogTreatsCategory._id,
        images: [
          'https://images.unsplash.com/photo-1598641795816-a84ac9eac2af?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '5 pack', price: 14.99, stock: 100, sku: 'DT-BS-5PK-001' },
          { size: '10 pack', price: 26.99, compareAtPrice: 29.99, stock: 75, sku: 'DT-BS-10PK-001' },
          { size: '25 pack', price: 59.99, compareAtPrice: 74.99, stock: 40, sku: 'DT-BS-25PK-001' }
        ],
        basePrice: 14.99,
        petType: 'dog',
        tags: ['bully stick', 'natural', 'beef', 'long-lasting'],
        features: ['100% natural beef', 'No chemicals or additives', 'Long-lasting', 'Promotes dental health', 'High protein'],
        ingredients: 'Beef Pizzle',
        isActive: true,
        isFeatured: false,
        autoshipEligible: true,
        autoshipDiscount: 10,
        averageRating: 4.9,
        totalReviews: 612
      },
      {
        name: 'Peanut Butter Dog Biscuits',
        description: 'Crunchy baked biscuits made with real peanut butter. No artificial flavors or preservatives. Perfect as a reward or daily treat. Oven-baked for a satisfying crunch dogs love.',
        shortDescription: 'Crunchy peanut butter biscuits',
        brand: 'BakeryBones',
        category: dogTreatsCategory._id,
        images: [
          'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '12 oz', price: 9.99, stock: 120, sku: 'DT-PBB-12OZ-001' },
          { size: '24 oz', price: 17.99, stock: 90, sku: 'DT-PBB-24OZ-001' }
        ],
        basePrice: 9.99,
        petType: 'dog',
        tags: ['biscuits', 'peanut butter', 'crunchy', 'baked'],
        features: ['Real peanut butter', 'Oven-baked', 'Crunchy texture', 'No artificial ingredients', 'Made in USA'],
        ingredients: 'Whole Wheat Flour, Peanut Butter, Oats, Eggs, Honey',
        isActive: true,
        isFeatured: false,
        autoshipEligible: false,
        averageRating: 4.6,
        totalReviews: 234
      },

      // DOG TOYS
      {
        name: 'Durable Rope Tug Toy',
        description: 'Heavy-duty rope toy perfect for tugging and interactive play. Made from durable cotton fibers that help clean teeth during play. Great for medium to large dogs. Machine washable.',
        shortDescription: 'Durable rope toy for interactive play',
        brand: 'PlayPup',
        category: dogToysCategory._id,
        images: [
          'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Medium', price: 12.99, stock: 100, sku: 'DOG-TOY-RT-M-001' },
          { size: 'Large', price: 16.99, stock: 75, sku: 'DOG-TOY-RT-L-001' }
        ],
        basePrice: 12.99,
        petType: 'dog',
        tags: ['toy', 'rope', 'tug', 'interactive'],
        features: ['Durable cotton rope', 'Teeth cleaning action', 'Interactive play', 'Machine washable', 'Non-toxic materials'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false,
        averageRating: 4.5,
        totalReviews: 189
      },
      {
        name: 'Squeaky Plush Duck Toy',
        description: 'Soft plush toy with built-in squeaker that dogs love. Perfect for fetch and cuddle time. Durable stitching and reinforced seams. Available in adorable duck design.',
        shortDescription: 'Soft plush squeaky toy',
        brand: 'PlayPup',
        category: dogToysCategory._id,
        images: [
          'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Small', price: 8.99, stock: 150, sku: 'DOG-TOY-SPD-S-001' },
          { size: 'Large', price: 14.99, stock: 100, sku: 'DOG-TOY-SPD-L-001' }
        ],
        basePrice: 8.99,
        petType: 'dog',
        tags: ['toy', 'plush', 'squeaky', 'soft'],
        features: ['Built-in squeaker', 'Soft plush material', 'Durable stitching', 'Perfect for fetch', 'Fun duck design'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false,
        averageRating: 4.4,
        totalReviews: 267
      },
      {
        name: 'Indestructible Rubber Ball',
        description: 'Nearly indestructible rubber ball for aggressive chewers. Bounces erratically for exciting fetch games. Textured surface massages gums and cleans teeth. Floating design for water play.',
        shortDescription: 'Tough rubber ball for power chewers',
        brand: 'ToughToys',
        category: dogToysCategory._id,
        images: [
          'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Medium (2.5")', price: 11.99, stock: 90, sku: 'DOG-TOY-IRB-M-001' },
          { size: 'Large (3.5")', price: 15.99, stock: 70, sku: 'DOG-TOY-IRB-L-001' }
        ],
        basePrice: 11.99,
        petType: 'dog',
        tags: ['toy', 'ball', 'rubber', 'indestructible'],
        features: ['Nearly indestructible', 'Erratic bounce', 'Floats in water', 'Textured surface', 'Non-toxic rubber'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false,
        averageRating: 4.8,
        totalReviews: 445
      },
      {
        name: 'Interactive Treat Puzzle',
        description: 'Mental stimulation puzzle toy that dispenses treats. Adjustable difficulty levels keep dogs engaged. Great for slowing down fast eaters and providing mental exercise. Easy to clean.',
        shortDescription: 'Puzzle toy for mental stimulation',
        brand: 'SmartPaws',
        category: dogToysCategory._id,
        images: [
          'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Standard', price: 19.99, stock: 65, sku: 'DOG-TOY-ITP-STD-001' }
        ],
        basePrice: 19.99,
        petType: 'dog',
        tags: ['toy', 'puzzle', 'interactive', 'mental stimulation'],
        features: ['Adjustable difficulty', 'Dispenses treats', 'Mental exercise', 'Slow feeder', 'Easy to clean'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false,
        averageRating: 4.7,
        totalReviews: 312
      },

      // DOG SUPPLIES
      {
        name: 'Stainless Steel Dog Bowl Set',
        description: 'Durable stainless steel bowls with non-slip rubber base. Dishwasher safe and rust-resistant. Perfect for food and water. Includes two bowls in matching design.',
        shortDescription: 'Durable stainless steel bowls',
        brand: 'PawEssentials',
        category: dogSuppliesCategory._id,
        images: [
          'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Small (16 oz each)', price: 16.99, stock: 80, sku: 'DOG-SUP-SSB-S-001' },
          { size: 'Medium (32 oz each)', price: 21.99, stock: 70, sku: 'DOG-SUP-SSB-M-001' },
          { size: 'Large (64 oz each)', price: 27.99, stock: 60, sku: 'DOG-SUP-SSB-L-001' }
        ],
        basePrice: 16.99,
        petType: 'dog',
        tags: ['bowls', 'stainless steel', 'feeding', 'water'],
        features: ['Rust-resistant', 'Non-slip base', 'Dishwasher safe', 'Includes 2 bowls', 'Easy to clean'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false,
        averageRating: 4.6,
        totalReviews: 178
      },
      {
        name: 'Comfortable Dog Leash - 6 Feet',
        description: 'Padded handle leash for comfortable walks. Heavy-duty nylon with reflective stitching for nighttime safety. 360-degree swivel clip prevents tangling. Available in multiple colors.',
        shortDescription: 'Comfortable padded handle leash',
        brand: 'WalkWell',
        category: dogSuppliesCategory._id,
        images: [
          'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Blue', price: 14.99, stock: 60, sku: 'DOG-SUP-CDL-BLU-001' },
          { size: 'Red', price: 14.99, stock: 55, sku: 'DOG-SUP-CDL-RED-001' },
          { size: 'Black', price: 14.99, stock: 65, sku: 'DOG-SUP-CDL-BLK-001' }
        ],
        basePrice: 14.99,
        petType: 'dog',
        tags: ['leash', 'walking', 'padded', 'reflective'],
        features: ['Padded handle', 'Reflective stitching', '360° swivel clip', 'Heavy-duty nylon', '6 feet length'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false,
        averageRating: 4.5,
        totalReviews: 203
      },
      {
        name: 'Orthopedic Dog Bed - Memory Foam',
        description: 'Premium memory foam dog bed with orthopedic support. Removable, machine-washable cover. Perfect for senior dogs or those with joint issues. Non-slip bottom keeps bed in place.',
        shortDescription: 'Memory foam orthopedic bed',
        brand: 'DreamRest',
        category: dogSuppliesCategory._id,
        images: [
          'https://images.unsplash.com/photo-1615485500134-275264546270?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Small (24" x 18")', price: 39.99, stock: 40, sku: 'DOG-SUP-ODB-S-001' },
          { size: 'Medium (36" x 24")', price: 59.99, stock: 35, sku: 'DOG-SUP-ODB-M-001' },
          { size: 'Large (44" x 35")', price: 79.99, stock: 25, sku: 'DOG-SUP-ODB-L-001' }
        ],
        basePrice: 39.99,
        petType: 'dog',
        tags: ['bed', 'memory foam', 'orthopedic', 'senior'],
        features: ['Memory foam support', 'Removable cover', 'Machine washable', 'Non-slip bottom', 'Joint support'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false,
        averageRating: 4.9,
        totalReviews: 534
      },

      // DOG HEALTH
      {
        name: 'Hip & Joint Supplements for Dogs',
        description: 'Glucosamine and chondroitin supplement for joint health. Reduces inflammation and supports cartilage. Bacon flavor dogs love. Veterinarian formulated for optimal absorption.',
        shortDescription: 'Joint health supplement chews',
        brand: 'VetCare',
        category: dogHealthCategory._id,
        images: [
          'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '60 count', price: 24.99, stock: 70, sku: 'DOG-HLH-HJS-60-001' },
          { size: '120 count', price: 44.99, compareAtPrice: 49.98, stock: 50, sku: 'DOG-HLH-HJS-120-001' }
        ],
        basePrice: 24.99,
        petType: 'dog',
        tags: ['supplements', 'joint health', 'glucosamine', 'chondroitin'],
        features: ['Glucosamine & chondroitin', 'Reduces inflammation', 'Bacon flavor', 'Vet formulated', 'Made in USA'],
        ingredients: 'Glucosamine HCl, Chondroitin Sulfate, MSM, Turmeric, Bacon Flavor',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 15,
        averageRating: 4.8,
        totalReviews: 678
      },
      {
        name: 'Omega-3 Fish Oil for Dogs',
        description: 'Premium omega-3 supplement supports skin, coat, heart, and immune health. Wild-caught fish oil in easy-to-give soft chews. No fishy aftertaste. Rich in EPA and DHA.',
        shortDescription: 'Omega-3 fish oil soft chews',
        brand: 'VetCare',
        category: dogHealthCategory._id,
        images: [
          'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '90 soft chews', price: 19.99, stock: 85, sku: 'DOG-HLH-O3F-90-001' },
          { size: '180 soft chews', price: 34.99, compareAtPrice: 39.98, stock: 60, sku: 'DOG-HLH-O3F-180-001' }
        ],
        basePrice: 19.99,
        petType: 'dog',
        tags: ['supplements', 'omega-3', 'fish oil', 'skin and coat'],
        features: ['Wild-caught fish oil', 'Rich in EPA & DHA', 'Supports skin & coat', 'Heart health', 'No fishy aftertaste'],
        ingredients: 'Fish Oil (Anchovy, Sardine), Gelatin, Glycerin, Natural Flavor',
        isActive: true,
        isFeatured: false,
        autoshipEligible: true,
        autoshipDiscount: 15,
        averageRating: 4.7,
        totalReviews: 421
      }
    ];

    await Product.insertMany(dogProducts);
    console.log(`✅ Created ${dogProducts.length} dog products\n`);

    // ==================== CAT PRODUCTS ====================
    console.log('Creating Cat products...');
    
    const catProducts = [
      // CAT FOOD
      {
        name: 'Grain-Free Cat Food - Salmon Formula',
        description: 'Grain-free cat food with real salmon as the first ingredient. Specially formulated for adult cats. Rich in omega-3 and omega-6 fatty acids for healthy skin and coat. No artificial preservatives.',
        shortDescription: 'Grain-free salmon formula for cats',
        brand: 'FelineFresh',
        category: catFoodCategory._id,
        images: [
          'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1548280899-d9e55f2e8c7b?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1572291889341-b4094c4ff9b6?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '3 lbs', price: 19.99, compareAtPrice: 24.99, stock: 60, sku: 'CF-SF-3LB-001' },
          { size: '7 lbs', price: 34.99, compareAtPrice: 42.99, stock: 45, sku: 'CF-SF-7LB-001' },
          { size: '14 lbs', price: 59.99, compareAtPrice: 74.99, stock: 30, sku: 'CF-SF-14LB-001' }
        ],
        basePrice: 19.99,
        compareAtPrice: 24.99,
        petType: 'cat',
        tags: ['grain-free', 'salmon', 'adult', 'dry food'],
        features: ['Real salmon #1 ingredient', 'Grain-free formula', 'High in protein', 'Omega fatty acids', 'No by-products'],
        ingredients: 'Salmon, Sweet Potatoes, Peas, Salmon Meal, Chicken Fat, Natural Flavors, Vitamins & Minerals',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10,
        averageRating: 4.8,
        totalReviews: 412
      },
      {
        name: 'Wet Cat Food Variety Pack - Chicken, Tuna, Turkey',
        description: 'Premium wet cat food variety pack with three delicious flavors. High moisture content keeps cats hydrated. Real meat as first ingredient in every recipe. Grain-free and gluten-free.',
        shortDescription: 'Variety pack with 3 flavors',
        brand: 'FelineFeast',
        category: catFoodCategory._id,
        images: [
          'https://images.unsplash.com/photo-1548280899-d9e55f2e8c7b?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '12 cans (3 oz)', price: 15.99, stock: 100, sku: 'CF-WFV-12C-001' },
          { size: '24 cans (3 oz)', price: 29.99, compareAtPrice: 31.98, stock: 75, sku: 'CF-WFV-24C-001' }
        ],
        basePrice: 15.99,
        petType: 'cat',
        tags: ['wet food', 'variety pack', 'chicken', 'tuna', 'turkey'],
        features: ['3 delicious flavors', 'High moisture content', 'Real meat first', 'Grain-free', 'Complete nutrition'],
        ingredients: 'Varies by flavor: Chicken/Tuna/Turkey, Broth, Guar Gum, Vitamins & Minerals',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10,
        averageRating: 4.9,
        totalReviews: 567
      },
      {
        name: 'Kitten Food - Chicken & Rice Formula',
        description: 'Specially formulated for growing kittens up to 12 months. DHA supports brain and vision development. High protein for healthy growth. Small kibble size perfect for tiny mouths.',
        shortDescription: 'Complete nutrition for kittens',
        brand: 'KittenCare',
        category: catFoodCategory._id,
        images: [
          'https://images.unsplash.com/photo-1572291889341-b4094c4ff9b6?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '3 lbs', price: 21.99, stock: 55, sku: 'KF-CR-3LB-001' },
          { size: '7 lbs', price: 38.99, stock: 40, sku: 'KF-CR-7LB-001' }
        ],
        basePrice: 21.99,
        petType: 'cat',
        tags: ['kitten', 'chicken', 'rice', 'growth formula'],
        features: ['DHA for development', 'High protein', 'Small kibble size', 'Calcium for bones', 'Easy to digest'],
        ingredients: 'Chicken, Rice, Chicken Meal, Fish Oil, Vitamins & Minerals',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 10,
        averageRating: 4.8,
        totalReviews: 289
      },
      {
        name: 'Indoor Cat Food - Weight Control',
        description: 'Tailored nutrition for indoor cats. Lower calorie formula helps maintain healthy weight. Fiber blend supports healthy digestion. Reduces hairball formation.',
        shortDescription: 'Weight control for indoor cats',
        brand: 'IndoorCat',
        category: catFoodCategory._id,
        images: [
          'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1548280899-d9e55f2e8c7b?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '5 lbs', price: 24.99, stock: 50, sku: 'ICF-WC-5LB-001' },
          { size: '12 lbs', price: 44.99, stock: 35, sku: 'ICF-WC-12LB-001' }
        ],
        basePrice: 24.99,
        petType: 'cat',
        tags: ['indoor', 'weight control', 'hairball', 'low calorie'],
        features: ['Lower calorie', 'Hairball control', 'Indoor formula', 'Healthy weight', 'Fiber blend'],
        ingredients: 'Chicken, Rice, Corn Gluten Meal, Cellulose, Natural Flavors, Vitamins & Minerals',
        isActive: true,
        isFeatured: false,
        autoshipEligible: true,
        autoshipDiscount: 10,
        averageRating: 4.6,
        totalReviews: 234
      },

      // CAT TREATS
      {
        name: 'Crunchy Cat Treats - Tuna Flavor',
        description: 'Crunchy treats with real tuna. Low calorie and packed with flavor. Perfect for rewarding good behavior. Contains vitamins and minerals. Resealable pouch keeps treats fresh.',
        shortDescription: 'Crunchy tuna-flavored treats',
        brand: 'TreatTime',
        category: catTreatsCategory._id,
        images: [
          'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '3 oz', price: 4.99, stock: 150, sku: 'CT-CCT-3OZ-001' },
          { size: '6 oz', price: 8.99, stock: 120, sku: 'CT-CCT-6OZ-001' }
        ],
        basePrice: 4.99,
        petType: 'cat',
        tags: ['treats', 'tuna', 'crunchy', 'low calorie'],
        features: ['Real tuna', 'Crunchy texture', 'Low calorie', 'Vitamins added', 'Resealable pouch'],
        ingredients: 'Tuna, Wheat Flour, Rice, Natural Flavors, Vitamins & Minerals',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 5,
        averageRating: 4.7,
        totalReviews: 423
      },
      {
        name: 'Lickable Cat Treats - Chicken & Liver',
        description: 'Creamy lickable treats cats go crazy for. Chicken and liver flavor in convenient squeeze tubes. Great for bonding and administering medication. Grain-free formula.',
        shortDescription: 'Creamy lickable treats',
        brand: 'LickLove',
        category: catTreatsCategory._id,
        images: [
          'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '4 tubes (0.5 oz each)', price: 6.99, stock: 100, sku: 'CT-LCT-4T-001' },
          { size: '12 tubes (0.5 oz each)', price: 17.99, stock: 80, sku: 'CT-LCT-12T-001' }
        ],
        basePrice: 6.99,
        petType: 'cat',
        tags: ['treats', 'lickable', 'chicken', 'liver', 'squeeze tubes'],
        features: ['Creamy texture', 'Chicken & liver flavor', 'Grain-free', 'Easy to use tubes', 'Cats love it'],
        ingredients: 'Chicken, Liver, Water, Guar Gum, Natural Flavors',
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 5,
        averageRating: 4.9,
        totalReviews: 612
      },
      {
        name: 'Dental Treats for Cats',
        description: 'Crunchy treats designed to reduce tartar and plaque buildup. Unique shape cleans teeth as cats chew. Fresh breath formula with parsley. Veterinarian recommended.',
        shortDescription: 'Dental health treats',
        brand: 'DentaCat',
        category: catTreatsCategory._id,
        images: [
          'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '2.5 oz', price: 5.99, stock: 110, sku: 'CT-DCT-2.5OZ-001' },
          { size: '5.5 oz', price: 10.99, stock: 90, sku: 'CT-DCT-5.5OZ-001' }
        ],
        basePrice: 5.99,
        petType: 'cat',
        tags: ['treats', 'dental', 'tartar control', 'fresh breath'],
        features: ['Reduces tartar & plaque', 'Unique cleaning shape', 'Fresh breath', 'Vet recommended', 'Crunchy texture'],
        ingredients: 'Chicken, Rice Flour, Dried Parsley, Natural Flavors, Vitamins & Minerals',
        isActive: true,
        isFeatured: false,
        autoshipEligible: true,
        autoshipDiscount: 5,
        averageRating: 4.6,
        totalReviews: 287
      },

      // CAT TOYS
      {
        name: 'Interactive Feather Wand',
        description: 'Exciting feather wand toy that engages your cat\'s natural hunting instincts. Features colorful feathers and a flexible wand for dynamic play. Hours of entertainment guaranteed! Replaceable feathers available.',
        shortDescription: 'Feather wand for interactive play',
        brand: 'KittyPlay',
        category: catToysCategory._id,
        images: [
          'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1611267254323-4db7b39c732c?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Standard', price: 8.99, stock: 150, sku: 'CAT-TOY-IFW-STD-001' }
        ],
        basePrice: 8.99,
        petType: 'cat',
        tags: ['toy', 'feather', 'interactive', 'wand'],
        features: ['Natural feathers', 'Flexible wand', 'Engages hunting instincts', 'Encourages exercise', 'Replaceable feathers'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false,
        averageRating: 4.8,
        totalReviews: 534
      },
      {
        name: 'Catnip Mice - 6 Pack',
        description: 'Adorable plush mice filled with premium organic catnip. Perfect size for batting, carrying, and pouncing. Durable construction withstands rough play. Variety of colors included.',
        shortDescription: 'Catnip-filled plush mice',
        brand: 'CatNipToys',
        category: catToysCategory._id,
        images: [
          'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1611267254323-4db7b39c732c?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '6 pack', price: 12.99, stock: 100, sku: 'CAT-TOY-CNM-6PK-001' }
        ],
        basePrice: 12.99,
        petType: 'cat',
        tags: ['toy', 'catnip', 'mice', 'plush'],
        features: ['Organic catnip', '6 mice included', 'Variety of colors', 'Soft plush', 'Perfect size'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false,
        averageRating: 4.7,
        totalReviews: 389
      },
      {
        name: 'Cat Tunnel - Collapsible Play Tube',
        description: 'Spacious collapsible tunnel for hide-and-seek fun. Crinkle material adds exciting sounds. Multiple peek-holes and hanging toys. Folds flat for easy storage. Machine washable.',
        shortDescription: 'Collapsible crinkle tunnel',
        brand: 'TunnelTime',
        category: catToysCategory._id,
        images: [
          'https://images.unsplash.com/photo-1611267254323-4db7b39c732c?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '35" length', price: 16.99, stock: 75, sku: 'CAT-TOY-CTU-35-001' }
        ],
        basePrice: 16.99,
        petType: 'cat',
        tags: ['toy', 'tunnel', 'collapsible', 'crinkle'],
        features: ['Collapsible design', 'Crinkle material', 'Multiple peek-holes', 'Hanging toys', 'Machine washable'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false,
        averageRating: 4.8,
        totalReviews: 445
      },
      {
        name: 'Laser Pointer Cat Toy',
        description: 'Interactive laser pointer provides endless entertainment. Five different beam patterns. USB rechargeable battery. Auto-shutoff after 15 minutes. Safe for cat\'s eyes with proper use.',
        shortDescription: 'Interactive laser pointer',
        brand: 'LaserPlay',
        category: catToysCategory._id,
        images: [
          'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1611267254323-4db7b39c732c?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Standard', price: 14.99, stock: 85, sku: 'CAT-TOY-LPT-STD-001' }
        ],
        basePrice: 14.99,
        petType: 'cat',
        tags: ['toy', 'laser', 'interactive', 'electronic'],
        features: ['5 beam patterns', 'USB rechargeable', 'Auto-shutoff', 'Endless entertainment', 'Compact design'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false,
        averageRating: 4.6,
        totalReviews: 312
      },

      // CAT LITTER
      {
        name: 'Clumping Cat Litter - Unscented',
        description: 'Premium clumping litter with superior odor control. 99.9% dust-free for a cleaner home. Forms tight clumps for easy scooping. Made from natural clay. Unscented formula.',
        shortDescription: 'Premium clumping litter',
        brand: 'CleanPaws',
        category: catLitterCategory._id,
        images: [
          'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1597211833712-5e41faa202ea?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '14 lbs', price: 12.99, stock: 80, sku: 'CL-CCL-14LB-001' },
          { size: '28 lbs', price: 22.99, stock: 60, sku: 'CL-CCL-28LB-001' },
          { size: '40 lbs', price: 29.99, compareAtPrice: 32.99, stock: 45, sku: 'CL-CCL-40LB-001' }
        ],
        basePrice: 12.99,
        petType: 'cat',
        tags: ['litter', 'clumping', 'unscented', 'dust-free'],
        features: ['99.9% dust-free', 'Superior odor control', 'Tight clumping', 'Easy scooping', 'Natural clay'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: true,
        autoshipDiscount: 15,
        averageRating: 4.7,
        totalReviews: 678
      },
      {
        name: 'Natural Pine Litter - Lightweight',
        description: 'Eco-friendly natural pine litter. Lightweight for easy carrying. Natural pine scent neutralizes odors. Biodegradable and flushable. Low tracking formula keeps floors clean.',
        shortDescription: 'Eco-friendly pine litter',
        brand: 'NatureLitter',
        category: catLitterCategory._id,
        images: [
          'https://images.unsplash.com/photo-1597211833712-5e41faa202ea?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '18 lbs', price: 16.99, stock: 70, sku: 'CL-NPL-18LB-001' },
          { size: '36 lbs', price: 29.99, stock: 50, sku: 'CL-NPL-36LB-001' }
        ],
        basePrice: 16.99,
        petType: 'cat',
        tags: ['litter', 'pine', 'natural', 'lightweight', 'eco-friendly'],
        features: ['Eco-friendly', 'Natural pine scent', 'Lightweight', 'Biodegradable', 'Low tracking'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: true,
        autoshipDiscount: 15,
        averageRating: 4.5,
        totalReviews: 324
      },

      // CAT SUPPLIES
      {
        name: 'Stainless Steel Cat Bowls - Set of 2',
        description: 'Premium stainless steel bowls perfect for food and water. Wide shallow design reduces whisker fatigue. Dishwasher safe and rust-proof. Non-slip rubber base prevents sliding.',
        shortDescription: 'Stainless steel feeding bowls',
        brand: 'WhiskerFree',
        category: catSuppliesCategory._id,
        images: [
          'https://images.unsplash.com/photo-1516750931-78a5b16a4014?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '2 bowls (8 oz each)', price: 14.99, stock: 90, sku: 'CAT-SUP-SSB-8OZ-001' }
        ],
        basePrice: 14.99,
        petType: 'cat',
        tags: ['bowls', 'stainless steel', 'feeding', 'whisker friendly'],
        features: ['Reduces whisker fatigue', 'Rust-proof', 'Dishwasher safe', 'Non-slip base', '2 bowls included'],
        isActive: true,
        isFeatured: false,
        autoshipEligible: false,
        averageRating: 4.8,
        totalReviews: 234
      },
      {
        name: 'Cat Scratching Post - Tall Sisal',
        description: 'Tall sisal rope scratching post satisfies natural scratching instincts. Sturdy base prevents tipping. Soft plush top for lounging. Dangling toy for extra fun. Saves your furniture!',
        shortDescription: 'Tall sisal scratching post',
        brand: 'ScratchSaver',
        category: catSuppliesCategory._id,
        images: [
          'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1516750931-78a5b16a4014?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: '24" tall', price: 24.99, stock: 55, sku: 'CAT-SUP-CSP-24-001' },
          { size: '32" tall', price: 34.99, stock: 45, sku: 'CAT-SUP-CSP-32-001' }
        ],
        basePrice: 24.99,
        petType: 'cat',
        tags: ['scratching post', 'sisal', 'furniture protection'],
        features: ['Natural sisal rope', 'Sturdy base', 'Plush top', 'Dangling toy', 'Protects furniture'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false,
        averageRating: 4.7,
        totalReviews: 412
      },
      {
        name: 'Covered Cat Litter Box with Scoop',
        description: 'Large covered litter box provides privacy and contains odors. Carbon filter lid reduces smells. Easy-clean design with removable top. Includes matching scoop. Non-stick surface.',
        shortDescription: 'Large covered litter box',
        brand: 'PrivatePaws',
        category: catSuppliesCategory._id,
        images: [
          'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=800&h=800&fit=crop&q=90',
          'https://images.unsplash.com/photo-1516750931-78a5b16a4014?w=800&h=800&fit=crop&q=90'
        ],
        variants: [
          { size: 'Large', price: 29.99, stock: 60, sku: 'CAT-SUP-CLB-LG-001' },
          { size: 'Extra Large', price: 39.99, stock: 40, sku: 'CAT-SUP-CLB-XL-001' }
        ],
        basePrice: 29.99,
        petType: 'cat',
        tags: ['litter box', 'covered', 'privacy', 'odor control'],
        features: ['Carbon filter lid', 'Privacy cover', 'Easy-clean design', 'Includes scoop', 'Non-stick surface'],
        isActive: true,
        isFeatured: true,
        autoshipEligible: false,
        averageRating: 4.6,
        totalReviews: 356
      }
    ];

    await Product.insertMany(catProducts);
    console.log(`✅ Created ${catProducts.length} cat products\n`);

    // ==================== SUMMARY ====================
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    
    console.log('\n🎉 ==================== SEEDING COMPLETE ==================== 🎉\n');
    console.log(`✅ Total Categories: ${totalCategories}`);
    console.log(`✅ Total Products: ${totalProducts}`);
    console.log(`   - Dog Products: ${dogProducts.length}`);
    console.log(`   - Cat Products: ${catProducts.length}`);
    console.log('\n📦 Product Categories:');
    console.log('   🐕 Dog: Food, Treats, Toys, Supplies, Health');
    console.log('   🐱 Cat: Food, Treats, Toys, Litter, Supplies');
    console.log('\n💡 Features:');
    console.log('   - High-quality product images from Unsplash');
    console.log('   - Multiple variants (sizes, colors)');
    console.log('   - Competitive pricing with compare-at prices');
    console.log('   - Detailed descriptions and features');
    console.log('   - Customer ratings and reviews');
    console.log('   - Autoship eligibility and discounts');
    console.log('\n🛒 All products are now available for customers to add to cart!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();

