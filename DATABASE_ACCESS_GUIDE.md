# Database Access Guide

This guide explains how to view and manage data stored in your MongoDB database.

---

## 📊 Option 1: MongoDB Atlas Web Interface (Recommended)

If you're using MongoDB Atlas (cloud database):

### Steps:
1. **Log in to MongoDB Atlas**
   - Go to https://cloud.mongodb.com
   - Sign in with your MongoDB Atlas account

2. **Navigate to Your Cluster**
   - Click on your cluster name
   - Go to the "Collections" tab

3. **Browse Collections**
   - Click on your database name (e.g., `pet-ecommerce`)
   - You'll see all collections:
     - `users` - All user accounts (customers, admins, staff)
     - `products` - All products
     - `categories` - Product categories
     - `orders` - All orders
     - `reviews` - Product reviews
     - `donations` - Donation records
     - `pettypes` - Pet types

4. **View Documents**
   - Click on any collection to see all documents
   - Click on a document to view its details
   - Use filters and search to find specific data

---

## 🖥️ Option 2: MongoDB Compass (Desktop GUI)

MongoDB Compass is a free GUI tool for viewing and managing MongoDB data.

### Installation:
1. Download from: https://www.mongodb.com/try/download/compass
2. Install the application

### Connection:
1. **Get Your Connection String**
   - From MongoDB Atlas: Click "Connect" → "Connect using MongoDB Compass"
   - Copy the connection string
   - Replace `<password>` with your actual password

2. **Connect in Compass**
   - Open MongoDB Compass
   - Paste the connection string
   - Click "Connect"

3. **Browse Data**
   - Select your database
   - Click on collections to view documents
   - Use filters, search, and aggregation pipelines

---

## 💻 Option 3: MongoDB Shell (mongosh)

Command-line tool for accessing MongoDB.

### Installation:
```bash
npm install -g mongosh
```

### Connection:
```bash
# For MongoDB Atlas
mongosh "mongodb+srv://username:password@cluster.mongodb.net/pet-ecommerce"

# For local MongoDB
mongosh mongodb://localhost:27017/pet-ecommerce
```

### Useful Commands:

```javascript
// Show all databases
show dbs

// Use your database
use pet-ecommerce

// Show all collections
show collections

// View all users
db.users.find().pretty()

// Count users
db.users.countDocuments()

// View admins only
db.users.find({ role: 'admin' }).pretty()

// View customers only
db.users.find({ role: 'customer' }).pretty()

// View all products
db.products.find().pretty()

// View all orders
db.orders.find().pretty()

// View recent orders (last 10)
db.orders.find().sort({ createdAt: -1 }).limit(10).pretty()

// Count documents in each collection
db.users.countDocuments()
db.products.countDocuments()
db.orders.countDocuments()
db.categories.countDocuments()
db.reviews.countDocuments()
db.donations.countDocuments()
```

---

## 🌐 Option 4: Admin Dashboard (Built-in)

Your admin dashboard already has features to view data:

### View Users:
1. Go to **Customers** page in admin dashboard
2. View all customer accounts
3. See user details, orders, etc.

### View Products:
1. Go to **Products** page
2. See all products with details
3. Filter and search products

### View Orders:
1. Go to **Orders** page
2. See all orders
3. View order details, status, etc.

### View Analytics:
1. Go to **Analytics** page
2. See database statistics:
   - Total users
   - Total products
   - Total orders
   - Revenue data
   - Donation statistics

---

## 🔧 Option 5: Admin Dashboard API Endpoint (Built-in)

Your admin dashboard has a built-in database statistics endpoint:

### API Endpoint:
- **URL**: `/api/users/database/stats`
- **Method**: `GET`
- **Auth**: Requires admin authentication
- **Response**: Complete database statistics

### Usage in Admin Dashboard:
The endpoint is available through `adminService.getDatabaseStats()` and provides:
- User statistics (total, customers, admins, staff, active/inactive)
- Product statistics (total, active, inactive, in stock, out of stock)
- Order statistics (total, by status)
- Category statistics
- Review statistics
- Donation statistics
- Financial statistics (total revenue, donations)

### Example Response:
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "customers": 145,
      "admins": 2,
      "staff": 3,
      "active": 148,
      "inactive": 2
    },
    "products": {
      "total": 500,
      "active": 480,
      "inactive": 20,
      "inStock": 450,
      "outOfStock": 50
    },
    "orders": {
      "total": 1200,
      "pending": 10,
      "processing": 5,
      "shipped": 15,
      "delivered": 1150,
      "cancelled": 20
    },
    "financial": {
      "totalRevenue": 50000,
      "totalDonations": 5000,
      "totalWithDonations": 55000
    }
  }
}
```

---

## 📋 Quick Reference: Collection Structure

### Users Collection
- **Fields**: firstName, lastName, email, password (hashed), role, phone, addresses, wishlist
- **Roles**: 'customer', 'admin', 'staff'

### Products Collection
- **Fields**: name, slug, description, images, price, category, variants, stock, ratings

### Orders Collection
- **Fields**: orderNumber, user, items, totalAmount, status, paymentIntent, shippingAddress

### Categories Collection
- **Fields**: name, slug, description, imageUrl, parentCategory, petType

### Reviews Collection
- **Fields**: product, user, rating, comment, order

### Donations Collection
- **Fields**: amount, paymentIntentId, status, donorInfo

---

## 🔐 Security Notes

- **Never share your MongoDB connection string publicly**
- **Use read-only access for viewing data**
- **Admin dashboard requires authentication**
- **Passwords are hashed and cannot be viewed**

---

## 🆘 Troubleshooting

### Can't Connect to Database:
1. Check your `MONGODB_URI` environment variable
2. Verify network access in MongoDB Atlas
3. Check if IP address is whitelisted (Atlas)

### Can't See Data:
1. Verify you're connected to the correct database
2. Check collection names match exactly
3. Verify you have read permissions

---

## 📞 Need Help?

- MongoDB Atlas Support: https://www.mongodb.com/docs/atlas/
- MongoDB Compass Docs: https://www.mongodb.com/docs/compass/
- MongoDB Shell Docs: https://www.mongodb.com/docs/mongodb-shell/

