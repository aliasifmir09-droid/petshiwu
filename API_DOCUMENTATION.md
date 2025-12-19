# 📚 API Documentation

**Base URL:** `http://localhost:5000/api` (Development)  
**Production URL:** `https://api.petshiwu.com/api`  
**Swagger UI:** `http://localhost:5000/api-docs` (Development)

---

## 🔐 Authentication

All protected endpoints require authentication via JWT token stored in httpOnly cookie.

### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "customer"
    }
  },
  "message": "User registered successfully. Please verify your email."
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "customer"
    }
  },
  "message": "Login successful"
}
```

**Note:** JWT token is automatically set as httpOnly cookie. No need to manually handle tokens.

### Get Current User

```http
GET /api/auth/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "customer",
    "isEmailVerified": true
  }
}
```

### Logout

```http
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🛍️ Products

### Get All Products

```http
GET /api/products?page=1&limit=20&petType=dog&category=food&minPrice=10&maxPrice=100&sort=price&order=asc
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `petType` (string): Filter by pet type slug (e.g., "dog", "cat")
- `category` (string): Filter by category slug
- `search` (string): Search query
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `inStock` (boolean): Filter by stock availability
- `isFeatured` (boolean): Filter featured products
- `brand` (string): Filter by brand
- `sort` (string): Sort field (price, rating, createdAt, name)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Premium Dog Food",
      "slug": "premium-dog-food",
      "description": "High-quality dog food...",
      "brand": "PetBrand",
      "basePrice": 29.99,
      "compareAtPrice": 39.99,
      "petType": "dog",
      "category": "food",
      "images": ["https://example.com/image1.jpg"],
      "inStock": true,
      "stockQuantity": 100,
      "isFeatured": true,
      "averageRating": 4.5,
      "totalReviews": 120,
      "variants": [
        {
          "name": "Size",
          "options": ["Small", "Medium", "Large"],
          "values": {
            "Small": { "price": 24.99, "stock": 50 },
            "Medium": { "price": 29.99, "stock": 30 },
            "Large": { "price": 34.99, "stock": 20 }
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get Product by ID or Slug

```http
GET /api/products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Premium Dog Food",
    "slug": "premium-dog-food",
    "description": "High-quality dog food...",
    "fullDescription": "<p>Detailed HTML description...</p>",
    "brand": "PetBrand",
    "basePrice": 29.99,
    "compareAtPrice": 39.99,
    "petType": "dog",
    "category": "food",
    "images": ["https://example.com/image1.jpg"],
    "inStock": true,
    "stockQuantity": 100,
    "isFeatured": true,
    "averageRating": 4.5,
    "totalReviews": 120,
    "variants": [...],
    "specifications": {
      "weight": "5 lbs",
      "ingredients": "Chicken, Rice, Vegetables"
    },
    "tags": ["premium", "grain-free", "organic"]
  }
}
```

### Get Product Recommendations

```http
GET /api/products/:id/recommendations?limit=8
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Dog Food Bowl",
      "recommendationType": "customers_also_bought",
      "score": 0.85,
      "orderCount": 45
    }
  ],
  "meta": {
    "total": 8,
    "types": {
      "customers_also_bought": 3,
      "frequently_bought_together": 2,
      "personalized": 1,
      "you_may_also_like": 2
    }
  }
}
```

### Get Frequently Bought Together

```http
GET /api/products/:id/frequently-bought-together?limit=4
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Dog Food Bowl",
      "recommendationType": "frequently_bought_together",
      "score": 0.92
    }
  ]
}
```

---

## 🛒 Cart & Checkout

### Get Cart

```http
GET /api/cart
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Premium Dog Food",
          "images": ["https://example.com/image1.jpg"],
          "basePrice": 29.99
        },
        "quantity": 2,
        "selectedVariant": {
          "Size": "Large"
        },
        "price": 34.99,
        "subtotal": 69.98
      }
    ],
    "subtotal": 69.98,
    "shipping": 5.99,
    "tax": 5.60,
    "total": 81.57
  }
}
```

### Add to Cart

```http
POST /api/cart
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2,
  "selectedVariant": {
    "Size": "Large"
  }
}
```

### Update Cart Item

```http
PUT /api/cart/:itemId
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove from Cart

```http
DELETE /api/cart/:itemId
```

### Clear Cart

```http
DELETE /api/cart
```

---

## 📦 Orders

### Create Order

```http
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "product": "507f1f77bcf86cd799439011",
      "quantity": 2,
      "price": 34.99,
      "selectedVariant": {
        "Size": "Large"
      }
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US",
    "phone": "+1234567890"
  },
  "paymentMethod": "stripe",
  "paymentIntentId": "pi_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "orderNumber": "ORD-2024-001",
    "status": "pending",
    "items": [...],
    "subtotal": 69.98,
    "shipping": 5.99,
    "tax": 5.60,
    "total": 81.57,
    "shippingAddress": {...},
    "paymentMethod": "stripe",
    "createdAt": "2024-12-18T10:00:00.000Z"
  }
}
```

### Get User Orders

```http
GET /api/orders?page=1&limit=10&status=pending
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "orderNumber": "ORD-2024-001",
      "status": "pending",
      "total": 81.57,
      "createdAt": "2024-12-18T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

### Get Order by ID

```http
GET /api/orders/:id
```

### Track Order

```http
GET /api/orders/track/:orderNumber
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD-2024-001",
    "status": "shipped",
    "trackingNumber": "TRACK123456",
    "trackingUrl": "https://tracking.example.com/TRACK123456",
    "estimatedDelivery": "2024-12-20",
    "statusHistory": [
      {
        "status": "pending",
        "date": "2024-12-18T10:00:00.000Z"
      },
      {
        "status": "confirmed",
        "date": "2024-12-18T10:05:00.000Z"
      },
      {
        "status": "shipped",
        "date": "2024-12-19T14:00:00.000Z"
      }
    ]
  }
}
```

---

## ⭐ Reviews

### Get Product Reviews

```http
GET /api/reviews/product/:productId?page=1&limit=10&sort=recent
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe"
      },
      "rating": 5,
      "title": "Great product!",
      "comment": "My dog loves this food...",
      "verifiedPurchase": true,
      "helpfulCount": 12,
      "createdAt": "2024-12-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### Create Review

```http
POST /api/reviews
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439011",
  "orderId": "507f1f77bcf86cd799439020",
  "rating": 5,
  "title": "Great product!",
  "comment": "My dog loves this food..."
}
```

---

## 📚 Blogs & Care Guides

### Get Published Blogs

```http
GET /api/blogs?page=1&limit=10&petType=dog&category=Dog Care
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "title": "How to Care for Your New Puppy",
      "slug": "how-to-care-for-your-new-puppy",
      "excerpt": "A comprehensive guide...",
      "featuredImage": "https://example.com/image.jpg",
      "petType": "dog",
      "category": "Dog Care",
      "author": {
        "_id": "507f1f77bcf86cd799439050",
        "name": "Dr. Jane Smith",
        "email": "jane@example.com"
      },
      "tags": ["puppy", "care", "training"],
      "views": 1250,
      "publishedAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### Get Blog by Slug

```http
GET /api/blogs/:slug
```

### Get Blog Categories

```http
GET /api/blogs/categories?petType=dog
```

### Get Published Care Guides

```http
GET /api/care-guides?page=1&limit=10&petType=dog&category=Health&difficulty=beginner
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439060",
      "title": "Dog Health Basics",
      "slug": "dog-health-basics",
      "excerpt": "Essential health tips...",
      "featuredImage": "https://example.com/image.jpg",
      "petType": "dog",
      "category": "Health",
      "difficulty": "beginner",
      "sections": [
        {
          "title": "Introduction",
          "content": "<p>Content here...</p>",
          "order": 0
        }
      ],
      "readingTimeMinutes": 5,
      "views": 850,
      "publishedAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

---

## 🔍 Search

### Search Products

```http
GET /api/search?q=dog food&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "categories": [...],
    "total": 45
  }
}
```

---

## 🎁 Wishlist

### Get Wishlist

```http
GET /api/wishlist
```

### Add to Wishlist

```http
POST /api/wishlist
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439011"
}
```

### Remove from Wishlist

```http
DELETE /api/wishlist/:productId
```

---

## 📊 Admin Endpoints

All admin endpoints require `admin` or `staff` role with appropriate permissions.

### Admin - Get All Products

```http
GET /api/products/admin/all?page=1&limit=20&search=dog&inStock=false
```

### Admin - Create Product

```http
POST /api/products/admin
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "brand": "Brand Name",
  "basePrice": 29.99,
  "petType": "dog",
  "category": "food",
  "stockQuantity": 100,
  "isActive": true,
  "isFeatured": false
}
```

### Admin - Update Product

```http
PUT /api/products/admin/:id
Content-Type: application/json

{
  "name": "Updated Product Name",
  "basePrice": 34.99
}
```

### Admin - Delete Product

```http
DELETE /api/products/admin/:id
```

---

## ⚠️ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information (development only)"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Example Error Response

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## 🔒 Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints:** 5 requests per 15 minutes
- **Registration:** 3 requests per 15 minutes
- **Public data endpoints:** 200 requests per minute (dev) / 100 requests per minute (prod)
- **General API:** 1000 requests per 15 minutes (dev) / 100 requests per 15 minutes (prod)

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

---

## 📝 Notes

1. **Authentication:** JWT tokens are stored in httpOnly cookies for security
2. **Pagination:** All list endpoints support pagination
3. **Filtering:** Most endpoints support multiple filter parameters
4. **Sorting:** List endpoints support sorting by various fields
5. **Image URLs:** All image URLs are normalized and served via CDN (Cloudinary)

---

## 🔗 Additional Resources

- **Swagger UI:** `http://localhost:5000/api-docs` (Interactive API documentation)
- **GitHub Repository:** [Your Repository URL]
- **Support Email:** support@petshiwu.com

---

**Last Updated:** December 2024

