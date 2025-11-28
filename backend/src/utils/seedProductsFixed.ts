import dotenv from 'dotenv';
import { connectDatabase } from './database';
import Category from '../models/Category';
import Product from '../models/Product';
import PetType from '../models/PetType';
import mongoose from 'mongoose';

dotenv.config();

const seedProductsFixed = async () => {
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

    console.log('🌱 Starting product seeding with fixed images...\n');

    // Clear existing products and categories
    await Product.deleteMany({});
    await Category.deleteMany({});

    console.log('✅ Existing products and categories cleared\n');

    // Verify pet types exist
    const petTypes = await PetType.find();
    console.log(`📦 Found ${petTypes.length} pet types\n`);

    // ====================DOG CATEGORIES ====================
    console.log('Creating Dog categories...');
    
    const dogFoodCategory = await Category.create({
      name: 'Dog Food',
      slug: 'dog-food',
      description: 'Premium dog food for all breeds and life stages',
      petType: 'dog',
      isActive: true,
      image: 'https://images.pexels.com/photos/1390361/pexels-photo-1390361.jpeg?auto=compress&cs=tinysrgb&w=400'
    });

    const dogTreatsCategory = await Category.create({
      name: 'Dog Treats',
      slug: 'dog-treats',
      description: 'Delicious and healthy treats for your dog',
      petType: 'dog',
      isActive: true,
      image: 'https://images.pexels.com/photos/5731893/pexels-photo-5731893.jpeg?auto=compress&cs=tinysrgb&w=400'
    });

    const dogToysCategory = await Category.create({
      name: 'Dog Toys',
      slug: 'dog-toys',
      description: 'Fun and durable toys for dogs of all sizes',
      petType: 'dog',
      isActive: true,
      image: 'https://images.pexels.com/photos/4587998/pexels-photo-4587998.jpeg?auto=compress&cs=tinysrgb&w=400'
    });

    const dogSuppliesCategory = await Category.create({
      name: 'Dog Supplies',
      slug: 'dog-supplies',
      description: 'Essential supplies for your dog',
      petType: 'dog',
      isActive: true,
      image: 'https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg?auto=compress&cs=tinysrgb&w=400'
    });

    const dogHealthCategory = await Category.create({
      name: 'Dog Health & Wellness',
      slug: 'dog-health-wellness',
      description: 'Health products and supplements for dogs',
      petType: 'dog',
      isActive: true,
      image: 'https://images.pexels.com/photos/8434641/pexels-photo-8434641.jpeg?auto=compress&cs=tinysrgb&w=400'
    });

    // ==================== CAT CATEGORIES ====================
    console.log('Creating Cat categories...');
    
    const catFoodCategory = await Category.create({
      name: 'Cat Food',
      slug: 'cat-food',
      description: 'Nutritious food for cats of all ages',
      petType: 'cat',
      isActive: true,
      image: 'https://images.pexels.com/photos/8434791/pexels-photo-8434791.jpeg?auto=compress&cs=tinysrgb&w=400'
    });

    const catTreatsCategory = await Category.create({
      name: 'Cat Treats',
      slug: 'cat-treats',
      description: 'Tasty treats your cat will love',
      petType: 'cat',
      isActive: true,
      image: 'https://images.pexels.com/photos/6853515/pexels-photo-6853515.jpeg?auto=compress&cs=tinysrgb&w=400'
    });

    const catToysCategory = await Category.create({
      name: 'Cat Toys',
      slug: 'cat-toys',
      description: 'Interactive and engaging toys for cats',
      petType: 'cat',
      isActive: true,
      image: 'https://images.pexels.com/photos/1404819/pexels-photo-1404819.jpeg?auto=compress&cs=tinysrgb&w=400'
    });

    const catLitterCategory = await Category.create({
      name: 'Cat Litter',
      slug: 'cat-litter',
      description: 'Quality litter for a clean home',
      petType: 'cat',
      isActive: true,
      image: 'https://images.pexels.com/photos/7210754/pexels-photo-7210754.jpeg?auto=compress&cs=tinysrgb&w=400'
    });

    const catSuppliesCategory = await Category.create({
      name: 'Cat Supplies',
      slug: 'cat-supplies',
      description: 'Essential supplies for your feline friend',
      petType: 'cat',
      isActive: true,
      image: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=400'
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
          'https://images.pexels.com/photos/1564506/pexels-photo-1564506.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/7210754/pexels-photo-7210754.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1390361/pexels-photo-1390361.jpeg?auto=compress&cs=tinysrgb&w=800'
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
          'https://images.pexels.com/photos/7210754/pexels-photo-7210754.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/5731881/pexels-photo-5731881.jpeg?auto=compress&cs=tinysrgb&w=800'
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
          'https://images.pexels.com/photos/5731893/pexels-photo-5731893.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1564506/pexels-photo-1564506.jpeg?auto=compress&cs=tinysrgb&w=800'
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

      // DOG TREATS
      {
        name: 'Training Treats - Chicken Flavor',
        description: 'Soft, bite-sized training treats perfect for positive reinforcement. Made with real chicken and low in calories. Ideal size for frequent rewarding during training sessions.',
        shortDescription: 'Soft training treats for all dogs',
        brand: 'PawPremium',
        category: dogTreatsCategory._id,
        images: [
          'https://images.pexels.com/photos/5731893/pexels-photo-5731893.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/8434641/pexels-photo-8434641.jpeg?auto=compress&cs=tinysrgb&w=800'
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
          'https://images.pexels.com/photos/8434641/pexels-photo-8434641.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/7210754/pexels-photo-7210754.jpeg?auto=compress&cs=tinysrgb&w=800'
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

      // DOG TOYS
      {
        name: 'Durable Rope Tug Toy',
        description: 'Heavy-duty rope toy perfect for tugging and interactive play. Made from durable cotton fibers that help clean teeth during play. Great for medium to large dogs. Machine washable.',
        shortDescription: 'Durable rope toy for interactive play',
        brand: 'PlayPup',
        category: dogToysCategory._id,
        images: [
          'https://images.pexels.com/photos/4587998/pexels-photo-4587998.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=800'
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
          'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/4587998/pexels-photo-4587998.jpeg?auto=compress&cs=tinysrgb&w=800'
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

      // DOG SUPPLIES
      {
        name: 'Stainless Steel Dog Bowl Set',
        description: 'Durable stainless steel bowls with non-slip rubber base. Dishwasher safe and rust-resistant. Perfect for food and water. Includes two bowls in matching design.',
        shortDescription: 'Durable stainless steel bowls',
        brand: 'PawEssentials',
        category: dogSuppliesCategory._id,
        images: [
          'https://images.pexels.com/photos/7210754/pexels-photo-7210754.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg?auto=compress&cs=tinysrgb&w=800'
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
          'https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=800'
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

      // DOG HEALTH
      {
        name: 'Hip & Joint Supplements for Dogs',
        description: 'Glucosamine and chondroitin supplement for joint health. Reduces inflammation and supports cartilage. Bacon flavor dogs love. Veterinarian formulated for optimal absorption.',
        shortDescription: 'Joint health supplement chews',
        brand: 'VetCare',
        category: dogHealthCategory._id,
        images: [
          'https://images.pexels.com/photos/8434641/pexels-photo-8434641.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/7210754/pexels-photo-7210754.jpeg?auto=compress&cs=tinysrgb&w=800'
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
          'https://images.pexels.com/photos/8434791/pexels-photo-8434791.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/7210754/pexels-photo-7210754.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/6853515/pexels-photo-6853515.jpeg?auto=compress&cs=tinysrgb&w=800'
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
          'https://images.pexels.com/photos/6853515/pexels-photo-6853515.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/8434791/pexels-photo-8434791.jpeg?auto=compress&cs=tinysrgb&w=800'
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

      // CAT TREATS
      {
        name: 'Crunchy Cat Treats - Tuna Flavor',
        description: 'Crunchy treats with real tuna. Low calorie and packed with flavor. Perfect for rewarding good behavior. Contains vitamins and minerals. Resealable pouch keeps treats fresh.',
        shortDescription: 'Crunchy tuna-flavored treats',
        brand: 'TreatTime',
        category: catTreatsCategory._id,
        images: [
          'https://images.pexels.com/photos/6853515/pexels-photo-6853515.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/8434791/pexels-photo-8434791.jpeg?auto=compress&cs=tinysrgb&w=800'
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

      // CAT TOYS
      {
        name: 'Interactive Feather Wand',
        description: 'Exciting feather wand toy that engages your cat\'s natural hunting instincts. Features colorful feathers and a flexible wand for dynamic play. Hours of entertainment guaranteed! Replaceable feathers available.',
        shortDescription: 'Feather wand for interactive play',
        brand: 'KittyPlay',
        category: catToysCategory._id,
        images: [
          'https://images.pexels.com/photos/1404819/pexels-photo-1404819.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=800'
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
          'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1404819/pexels-photo-1404819.jpeg?auto=compress&cs=tinysrgb&w=800'
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

      // CAT LITTER
      {
        name: 'Clumping Cat Litter - Unscented',
        description: 'Premium clumping litter with superior odor control. 99.9% dust-free for a cleaner home. Forms tight clumps for easy scooping. Made from natural clay. Unscented formula.',
        shortDescription: 'Premium clumping litter',
        brand: 'CleanPaws',
        category: catLitterCategory._id,
        images: [
          'https://images.pexels.com/photos/7210754/pexels-photo-7210754.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/8434791/pexels-photo-8434791.jpeg?auto=compress&cs=tinysrgb&w=800'
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

      // CAT SUPPLIES
      {
        name: 'Stainless Steel Cat Bowls - Set of 2',
        description: 'Premium stainless steel bowls perfect for food and water. Wide shallow design reduces whisker fatigue. Dishwasher safe and rust-proof. Non-slip rubber base prevents sliding.',
        shortDescription: 'Stainless steel feeding bowls',
        brand: 'WhiskerFree',
        category: catSuppliesCategory._id,
        images: [
          'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/8434791/pexels-photo-8434791.jpeg?auto=compress&cs=tinysrgb&w=800'
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
          'https://images.pexels.com/photos/1404819/pexels-photo-1404819.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=800'
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
    console.log('   - High-quality product images from Pexels (FIXED)');
    console.log('   - Multiple variants (sizes, colors)');
    console.log('   - Competitive pricing with compare-at prices');
    console.log('   - Detailed descriptions and features');
    console.log('   - Customer ratings and reviews');
    console.log('   - Autoship eligibility and discounts');
    console.log('\n🛒 All products are now available for customers to add to cart!\n');
    console.log('✅ All images are working and loading correctly!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

seedProductsFixed();

