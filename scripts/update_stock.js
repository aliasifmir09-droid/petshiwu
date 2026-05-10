const mongoose = require('mongoose');
require('dotenv').config();

// Define the Product Schema based on common patterns
const productSchema = new mongoose.Schema({
  name: String,
  stock: Number,
  quantity: Number // Some systems use 'quantity' instead of 'stock'
});

const Product = mongoose.model('Product', productSchema);

async function updateStock() {
  try {
    // Replace with your actual MongoDB URI from Render environment variables
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/petshiwu';
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Update both 'stock' and 'quantity' fields to 30 for all products
    const result = await Product.updateMany({}, { 
      $set: { 
        stock: 30,
        quantity: 30 
      } 
    });

    console.log(`Successfully updated ${result.modifiedCount} products to quantity 30.`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating stock:', error);
    process.exit(1);
  }
}

updateStock();
