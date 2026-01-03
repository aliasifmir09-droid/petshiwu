# 🐾 petshiwu - Pet E-Commerce Platform

A **complete, production-ready** full-stack e-commerce platform for pet products, featuring a modern customer-facing website, powerful admin dashboard, and robust backend API.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Features

### Customer Website
- **Modern Navigation**: Professional header with mega-menu dropdowns for all pet types
- **Hero Slideshow**: Auto-playing promotional carousel with customizable campaigns
- **Homepage**: Featured products, category browsing, shop by pet type
- **Product Catalog**: Advanced search, filtering, sorting by category, brand, price, pet type
- **Product Details**: Image gallery with zoom, variants, descriptions, verified reviews, ratings
- **Shopping Cart**: Add/remove items, quantity management, **real-time stock validation**
- **Stock Prevention**: Cannot add out-of-stock items, quantity limits, low stock warnings
- **Checkout**: Multi-step checkout process with address management and payment options
- **Cash on Delivery**: COD payment option for orders
- **User Account**: Profile management, order history, order tracking, address book
- **Autoship/Subscription**: Recurring delivery scheduling
- **Advanced Search**: Product search with autocomplete, suggestions, and search history
- **Reviews & Ratings**: Post-delivery verified reviews with star ratings and images
- **Product Comparison**: Side-by-side product comparison feature
- **Wishlist**: Save favorite products for later
- **Stock Alerts**: Get notified when out-of-stock items are back in stock
- **Donations**: Support animal welfare organizations
- **Blog & Care Guides**: Educational content for pet care
- **Returns Management**: Easy return request system
- **HTML Entity Support**: Proper display of special characters (e.g., &, <, >) in category names

### Admin Dashboard
- **Dashboard Overview**: Real-time sales analytics, revenue charts, key metrics with auto-refresh
- **Out-of-Stock Alerts**: Prominent notifications with low-stock product list
- **Notification Badge**: Sidebar badge showing out-of-stock count
- **Product Management**: Full CRUD operations, bulk operations, CSV import/export, inventory tracking
- **Order Management**: View, process, update order status, full address details, order notifications
- **Customer Management**: View customer details, order history, customer analytics
- **Category Management**: Hierarchical category organization with drag-and-drop reordering
- **Pet Type Management**: Manage pet types with icons, emojis, and custom ordering
- **Analytics**: Sales reports, popular products, customer insights, advanced analytics
- **Subscription Management**: Manage autoship orders and recurring deliveries
- **User Management**: Create staff users with granular permissions (Admin only)
- **Role-Based Access**: Super Admin & Staff roles with permission control
- **Blog Management**: Create and manage blog posts
- **Care Guides**: Manage pet care guides and educational content
- **FAQ Management**: Create and organize frequently asked questions
- **Slideshow Management**: Manage hero banner slideshow campaigns
- **Email Templates**: Customize email templates for notifications
- **Settings**: User management, store configuration, system settings
- **Real-time Sync**: Dashboard automatically syncs with data changes (pet types, categories, products)

### Backend API
- **RESTful API**: Well-structured REST API with versioning support
- **Authentication & Authorization**: JWT-based auth with refresh tokens, role-based access control
- **Database Models**: 18 comprehensive models (Products, Orders, Users, Reviews, Categories, etc.)
- **File Upload**: Secure image upload with Cloudinary integration, file validation
- **Order Processing**: Complete order lifecycle management
- **Email Notifications**: Email service for order confirmations and notifications
- **Payment Integration**: Ready for payment gateway integration (Stripe/PayPal)
- **Caching**: Redis caching with in-memory fallback for performance
- **Rate Limiting**: API rate limiting for security
- **Search Analytics**: Track search queries and product views
- **Recommendations**: Product recommendation engine with analytics
- **Performance Optimized**: Aggregation pipelines, database indexing, query optimization
- **Error Handling**: Comprehensive error handling and logging
- **Database Resilience**: Automatic reconnection and health checks

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query (TanStack Query)** for data fetching and caching
- **Zustand** for state management
- **Lucide React** for icons
- **Vite** for build tooling

### Admin Panel
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Router** for navigation
- **React Query (TanStack Query)** for data management
- **Vite** for build tooling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Redis** for caching and rate limiting
- **Cloudinary** for image management
- **Winston** for logging
- **Multer** for file uploads
- **Bcrypt** for password hashing

### Infrastructure
- **MongoDB** - Primary database
- **Redis** - Caching and rate limiting
- **Cloudinary** - Image CDN and optimization

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** v6 or higher (running locally or connection string)
- **Redis** (optional, for caching - falls back to in-memory cache)
- **npm** or **yarn**

### Installation

**Option 1: Automated Install (Recommended)**

Windows:
```cmd
install.bat
```

macOS/Linux:
```bash
chmod +x install.sh
./install.sh
```

**Option 2: Manual Install**

```bash
npm run install:all
```

### Setup

1. **Configure Environment**
```bash
cd backend
cp .env.example .env
# Edit .env with your settings:
# - MongoDB connection string
# - JWT secrets
# - Redis connection (optional)
# - Cloudinary credentials (for image uploads)
```

2. **Seed Database** (creates sample data & admin user)
```bash
cd backend
npm run seed
```

3. **Start All Services**
```bash
# From project root
npm run dev
```

This starts:
- 🔧 **Backend API**: http://localhost:5000
- 🛍️ **Customer Website**: http://localhost:5173  
- 👨‍💼 **Admin Dashboard**: http://localhost:5174

**OR start individually:**
```bash
npm run dev:backend    # Backend API
npm run dev:frontend   # Customer Website
npm run dev:admin      # Admin Dashboard
```

## 🎯 Demo Accounts

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@petshiwu.com | admin123 | Full dashboard access |
| **Customer** | customer@example.com | password123 | Shopping & orders |

## 📸 Screenshots

### Customer Website
- **Homepage**: Featured products, categories, hero banners with slideshow
- **Product Listing**: Advanced filters, search, sorting, pagination
- **Product Detail**: Image gallery with zoom, variants, reviews, ratings, recommendations
- **Shopping Cart**: Quantity management, price calculations, stock validation
- **Checkout**: Multi-step form, shipping info, payment selection, donation option
- **User Profile**: Order history, order tracking, address management, wishlist

### Admin Dashboard
- **Analytics Dashboard**: Sales charts, revenue stats, key metrics, category distribution
- **Product Management**: CRUD operations, bulk operations, CSV import, inventory tracking
- **Order Management**: Status updates, order processing, notifications, customer details
- **Category Management**: Hierarchical view, drag-and-drop reordering, pet type association
- **Pet Type Management**: Manage pet types with icons, emojis, custom ordering
- **Real-time Statistics**: Live data updates with auto-refresh

## 📁 Project Structure

```
pet-ecommerce-platform/
├── frontend/          # Customer-facing website
│   ├── src/
│   │   ├── components/    # 33 reusable components
│   │   ├── pages/        # 31 page components
│   │   ├── services/     # 26 API service modules
│   │   ├── hooks/        # Custom React hooks
│   │   ├── stores/        # Zustand state stores
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   └── package.json
├── admin/            # Admin dashboard
│   ├── src/
│   │   ├── components/    # Reusable components + dashboard widgets
│   │   ├── pages/         # 15 admin pages
│   │   ├── services/      # API service modules
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript type definitions
│   └── package.json
├── backend/          # API server
│   ├── src/
│   │   ├── models/        # 18 Mongoose schemas
│   │   ├── routes/        # 26 API route definitions
│   │   ├── controllers/   # 31 controller modules
│   │   ├── middleware/    # 13 middleware functions
│   │   ├── utils/         # 23 utility modules
│   │   ├── scripts/       # 27 database scripts
│   │   └── workers/       # Background workers
│   └── package.json
├── scripts/          # Project-level scripts
├── install.bat       # Windows installation script
├── install.sh        # Unix installation script
└── package.json      # Root workspace configuration
```

## 🔒 Security Features

- **JWT-based authentication** with refresh tokens
- **Password hashing** with bcrypt (10 rounds)
- **CORS protection** with configurable origins
- **Input validation and sanitization** on all endpoints
- **Role-based access control** (Admin/Customer/Staff)
- **Rate limiting** to prevent abuse
- **File upload validation** (type, size, signature checking)
- **SQL injection prevention** (MongoDB NoSQL injection protection)
- **XSS protection** via input sanitization
- **Secure payment processing** ready (Stripe/PayPal integration ready)
- **Password expiry** for admin accounts
- **Session management** with token refresh

## 📱 Responsive Design

- **Fully responsive** across desktop, tablet, and mobile devices
- **Mobile-first** approach with progressive enhancement
- **Touch-friendly** interfaces with proper hit targets
- **Optimized images** with lazy loading and responsive sizes
- **Performance optimized** with code splitting and lazy loading

## 🎨 Design Features

- **Modern, clean UI** with professional design
- **Intuitive navigation** with mega-menu dropdowns
- **Fast page loads** with optimized assets and caching
- **Smooth animations** and transitions
- **Accessibility compliant** with ARIA labels and keyboard navigation
- **HTML entity support** for proper character display
- **Consistent color palette** throughout the application

## ⚡ Performance Features

- **React Query caching** for efficient data fetching
- **Redis caching** for frequently accessed data
- **Database indexing** for optimized queries
- **Aggregation pipelines** for complex data operations
- **Image optimization** with Cloudinary CDN
- **Code splitting** and lazy loading
- **Query batching** to reduce API calls
- **Request debouncing** for search inputs

## 📚 Documentation

### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[SETUP.md](SETUP.md)** - Detailed setup and troubleshooting guide
- **[README.md](README.md)** - This file (project overview)

### Feature Guides
- **[UI_UX_IMPROVEMENTS.md](UI_UX_IMPROVEMENTS.md)** - ⭐ Comprehensive UI/UX enhancements
- **[ADMIN_ROLE_SYSTEM_GUIDE.md](ADMIN_ROLE_SYSTEM_GUIDE.md)** - ⭐ Admin & staff user management
- **[CHEWY_HEADER_UPDATE.md](CHEWY_HEADER_UPDATE.md)** - Chewy-style header design
- **[SLIDESHOW_GUIDE.md](SLIDESHOW_GUIDE.md)** - Hero slideshow for promotions
- **[PRODUCT_REVIEW_SYSTEM.md](PRODUCT_REVIEW_SYSTEM.md)** - ⭐ Post-delivery review system
- **[PRODUCT_MANAGEMENT_GUIDE.md](PRODUCT_MANAGEMENT_GUIDE.md)** - How to add/edit products
- **[ADDING_CATEGORIES_AND_PET_TYPES.md](ADDING_CATEGORIES_AND_PET_TYPES.md)** - Category & pet type management
- **[CASH_ON_DELIVERY_GUIDE.md](CASH_ON_DELIVERY_GUIDE.md)** - COD payment system
- **[USER_PROFILE_AND_ORDERS_GUIDE.md](USER_PROFILE_AND_ORDERS_GUIDE.md)** - Profile & order tracking
- **[STOCK_NOTIFICATION_SYSTEM.md](STOCK_NOTIFICATION_SYSTEM.md)** - Out-of-stock notifications & cart prevention

### Technical Documentation
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- **[BACKEND_ANALYSIS.md](BACKEND_ANALYSIS.md)** - Backend architecture and analysis
- **[DEEP_PROJECT_ANALYSIS.md](DEEP_PROJECT_ANALYSIS.md)** - Deep dive into project structure
- **[PERFORMANCE_AND_IMPROVEMENTS_ANALYSIS.md](PERFORMANCE_AND_IMPROVEMENTS_ANALYSIS.md)** - Performance optimizations
- **[SEO_IMPLEMENTATION_GUIDE.md](SEO_IMPLEMENTATION_GUIDE.md)** - SEO best practices
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing strategies and examples
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Deployment guide

### Troubleshooting
- **[LOGIN_CREDENTIALS.md](LOGIN_CREDENTIALS.md)** - Test accounts & login help
- **[ORDER_PLACEMENT_FIX.md](ORDER_PLACEMENT_FIX.md)** - Order placement troubleshooting
- **[DASHBOARD_ISSUES_AUDIT.md](DASHBOARD_ISSUES_AUDIT.md)** - Dashboard sync and hardcoded values audit

## 🧪 Testing

### Test the Backend API
```bash
# Health check
curl http://localhost:5000/api/health

# Get products
curl http://localhost:5000/api/products

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@petshiwu.com","password":"admin123"}'
```

### Test Credentials
Use the demo accounts above to test authentication and authorization.

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test
```

## 📈 Roadmap & Future Enhancements

**Phase 1: Core Features** ✅ (Completed)
- [x] Customer website with shopping cart
- [x] Admin dashboard with analytics
- [x] Product & order management
- [x] Authentication & authorization
- [x] Responsive design
- [x] Stock validation & prevention system
- [x] Admin out-of-stock notifications
- [x] User profile & order tracking
- [x] Hero Slideshow
- [x] Post-delivery product reviews
- [x] Category & pet type management
- [x] HTML entity support
- [x] Dashboard real-time sync

**Phase 2: Advanced Features** (In Progress)
- [x] Cash on Delivery (COD) payment
- [x] Product recommendations engine
- [x] Search analytics
- [x] Performance optimizations (caching, indexing)
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Email notifications (order confirmations)
- [ ] Advanced search with Elasticsearch
- [ ] Multi-language support
- [ ] Social media integration

**Phase 3: Scale & Optimize**
- [x] Redis caching implementation
- [x] Database indexing optimization
- [x] Query performance improvements
- [ ] CDN integration (Cloudflare)
- [ ] Load balancing
- [ ] Microservices architecture
- [ ] GraphQL API option

**Phase 4: Mobile & Beyond**
- [ ] Mobile app (React Native)
- [ ] Progressive Web App (PWA) enhancements
- [ ] Push notifications
- [ ] AI-powered customer service
- [ ] Voice search integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Contribution Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for learning and commercial purposes.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by leading e-commerce platforms
- Designed for scalability and performance

---

**Made with ❤️ for pet lovers everywhere**
