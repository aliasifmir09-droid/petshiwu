# 🐾 petshiwu - Pet E-Commerce Platform

A **complete, production-ready** full-stack e-commerce platform for pet products, featuring a modern customer-facing website, powerful admin dashboard, and robust backend API. Inspired by Chewy.com.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Features

### Customer Website
- **Chewy-Style Header**: Professional blue header with clean navigation
- **Hero Slideshow**: Auto-playing promotional carousel with 4 campaigns
- **Homepage**: Featured products, category browsing, shop by pet
- **Product Catalog**: Search, filter, sort by category, brand, price
- **Product Details**: Images, descriptions, reviews, ratings
- **Shopping Cart**: Add/remove items, quantity management, **stock validation**
- **Stock Prevention**: Cannot add out-of-stock items, quantity limits
- **Checkout**: Multi-step checkout process with address and payment
- **Cash on Delivery**: COD payment option for orders
- **User Account**: Profile management, order history, order tracking
- **Autoship/Subscription**: Recurring delivery scheduling
- **Search**: Advanced product search with autocomplete
- **Reviews & Ratings**: Post-delivery verified reviews with star ratings

### Admin Dashboard
- **Dashboard Overview**: Sales analytics, revenue charts, key metrics
- **Out-of-Stock Alerts**: Red banner with low-stock notifications
- **Notification Badge**: Sidebar badge showing out-of-stock count
- **Product Management**: Add/edit/delete products, inventory tracking
- **Order Management**: View, process, update order status, full address details
- **Customer Management**: View customer details, order history
- **Category Management**: Organize product categories with inline creation
- **Analytics**: Sales reports, popular products, customer insights
- **Subscription Management**: Manage autoship orders
- **User Management**: Create staff users with granular permissions (Admin only)
- **Role-Based Access**: Super Admin & Staff roles with permission control
- **Settings**: User management, store configuration

### Backend API
- RESTful API architecture
- Authentication & Authorization (JWT)
- Database models for products, orders, users, reviews
- File upload for product images
- Order processing system
- Email notifications
- Payment integration ready

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Router, React Query
- **Admin Panel**: React 18, TypeScript, Tailwind CSS, Recharts, React Router
- **Backend**: Node.js, Express, TypeScript, MongoDB, JWT, Multer
- **State Management**: React Query, Context API
- **UI Components**: Custom components with Tailwind CSS
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** v6 or higher (running)
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
# Edit .env with your settings (defaults work fine for development)
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
- **Homepage**: Featured products, categories, hero banners
- **Product Listing**: Advanced filters, search, sorting
- **Product Detail**: Image gallery, variants, reviews, ratings
- **Shopping Cart**: Quantity management, price calculations
- **Checkout**: Multi-step form, shipping info, payment selection

### Admin Dashboard
- **Analytics Dashboard**: Sales charts, revenue stats, key metrics
- **Product Management**: CRUD operations, inventory tracking
- **Order Management**: Status updates, order processing
- **Real-time Statistics**: Live data updates

## 📁 Project Structure

```
pet-ecommerce-platform/
├── frontend/          # Customer-facing website
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── types/
├── admin/            # Admin dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── services/
├── backend/          # API server
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── utils/
└── package.json
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Role-based access control (Admin/Customer)
- Secure payment processing ready

## 📱 Responsive Design

- Fully responsive across desktop, tablet, and mobile
- Mobile-first approach
- Touch-friendly interfaces

## 🎨 Design Features

- Modern, clean UI inspired by Chewy.com
- Intuitive navigation
- Fast page loads
- Smooth animations and transitions
- Accessibility compliant

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

### Troubleshooting
- **[LOGIN_CREDENTIALS.md](LOGIN_CREDENTIALS.md)** - Test accounts & login help
- **[ORDER_PLACEMENT_FIX.md](ORDER_PLACEMENT_FIX.md)** - Order placement troubleshooting

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

## 📈 Roadmap & Future Enhancements

**Phase 1: Core Features** ✅ (Completed)
- [x] Customer website with shopping cart
- [x] Admin dashboard with analytics
- [x] Product & order management
- [x] Authentication & authorization
- [x] Responsive design

**Phase 2: Advanced Features** (In Progress)
- [x] Cash on Delivery (COD) payment
- [x] Stock validation & prevention system
- [x] Admin out-of-stock notifications
- [x] User profile & order tracking
- [x] Hero Slideshow
- [x] Chewy-style Header
- [x] Post-delivery product reviews (verified purchase)
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Email notifications (order confirmations)
- [ ] Product recommendations engine
- [ ] Advanced search with Elasticsearch

**Phase 3: Scale & Optimize**
- [ ] Redis caching
- [ ] CDN integration
- [ ] Performance optimization
- [ ] Load balancing
- [ ] Microservices architecture

**Phase 4: Mobile & Beyond**
- [ ] Mobile app (React Native)
- [ ] Progressive Web App (PWA)
- [ ] Social media integration
- [ ] Multi-language support
- [ ] AI-powered customer service

## 📄 License

MIT License - feel free to use this project for learning and commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

