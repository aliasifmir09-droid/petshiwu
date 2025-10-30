import dotenv from 'dotenv';
import { connectDatabase } from './database';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import mongoose from 'mongoose';

dotenv.config();

const seedData = async () => {
  try {
    await connectDatabase();

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log('Existing data cleared');

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@petshiwu.com',
      password: 'admin123',
      role: 'admin',
      phone: '555-0100'
    });

    // Create demo customer
    const customer = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer@example.com',
      password: 'password123',
      role: 'customer',
      phone: '555-0200'
    });

    console.log('Users created');

    // Create categories
    const dogCategory = await Category.create({
      name: 'Dog Food',
      slug: 'dog-food',
      description: 'Premium dog food for all breeds and sizes',
      petType: 'dog',
      isActive: true
    });

    const catCategory = await Category.create({
      name: 'Cat Food',
      slug: 'cat-food',
      description: 'Nutritious cat food for all life stages',
      petType: 'cat',
      isActive: true
    });

    const dogToysCategory = await Category.create({
      name: 'Dog Toys',
      slug: 'dog-toys',
      description: 'Fun and durable toys for dogs',
      petType: 'dog',
      isActive: true
    });

    const catToysCategory = await Category.create({
      name: 'Cat Toys',
      slug: 'cat-toys',
      description: 'Interactive toys for cats',
      petType: 'cat',
      isActive: true
    });

    console.log('Categories created');

    // Create sample products
    const products = [
      {
        name: 'Premium Dry Dog Food - Chicken & Rice',
        slug: 'premium-dry-dog-food-chicken-rice',
        description: 'High-quality dry dog food made with real chicken and wholesome rice. Perfect for adult dogs of all breeds. Contains essential nutrients, vitamins, and minerals for optimal health.',
        shortDescription: 'Premium chicken & rice formula for adult dogs',
        brand: 'PawPremium',
        category: dogCategory._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Food'],
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
        name: 'Grain-Free Cat Food - Salmon Formula',
        slug: 'grain-free-cat-food-salmon',
        description: 'Grain-free cat food with real salmon as the first ingredient. Specially formulated for adult cats with sensitive stomachs. Rich in omega-3 and omega-6 fatty acids.',
        shortDescription: 'Grain-free salmon formula for cats',
        brand: 'FelineFresh',
        category: catCategory._id,
        images: ['https://via.placeholder.com/500x500?text=Cat+Food'],
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
        name: 'Durable Rope Tug Toy',
        slug: 'durable-rope-tug-toy',
        description: 'Heavy-duty rope toy perfect for tugging and interactive play. Made from durable cotton fibers that help clean teeth during play. Great for medium to large dogs.',
        shortDescription: 'Durable rope toy for interactive play',
        brand: 'PlayPup',
        category: dogToysCategory._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Toy'],
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
        name: 'Interactive Feather Wand',
        slug: 'interactive-feather-wand',
        description: 'Exciting feather wand toy that engages your cat\'s natural hunting instincts. Features colorful feathers and a flexible wand for dynamic play. Hours of entertainment guaranteed!',
        shortDescription: 'Feather wand for interactive cat play',
        brand: 'KittyPlay',
        category: catToysCategory._id,
        images: ['https://via.placeholder.com/500x500?text=Cat+Toy'],
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
        name: 'Puppy Training Treats - Chicken Flavor',
        slug: 'puppy-training-treats-chicken',
        description: 'Soft, bite-sized training treats perfect for puppies. Made with real chicken and designed to be low in calories. Ideal for positive reinforcement training.',
        shortDescription: 'Soft training treats for puppies',
        brand: 'PawPremium',
        category: dogCategory._id,
        images: ['https://via.placeholder.com/500x500?text=Dog+Treats'],
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
      }
    ];

    await Product.insertMany(products);

    console.log('Products created');
    console.log('\n=== Seed Data Summary ===');
    console.log('Admin User:');
    console.log('  Email: admin@petstore.com');
    console.log('  Password: admin123');
    console.log('\nCustomer User:');
    console.log('  Email: customer@example.com');
    console.log('  Password: password123');
    console.log('\nCategories: 4');
    console.log('Products: 5');
    console.log('\n=== Seeding Complete ===');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();



