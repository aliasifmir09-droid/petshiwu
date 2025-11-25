# 🛠 Technology Stack & Platforms

## Overview
This is a **full-stack e-commerce platform** built with modern web technologies, featuring a monorepo structure with three main applications.

---

## 📦 Project Structure

### Monorepo Architecture
- **Root**: NPM Workspaces managing 3 applications
- **Frontend**: Customer-facing e-commerce website
- **Admin**: Admin dashboard for managing the platform
- **Backend**: RESTful API server

---

## 🎨 Frontend Technologies

### Customer Website (`frontend/`)

#### Core Framework
- **React 18.2.0** - UI library
- **TypeScript 5.3.3** - Type safety
- **Vite 5.0.11** - Build tool and dev server

#### Routing & State Management
- **React Router DOM 6.21.1** - Client-side routing
- **Zustand 4.4.7** - State management (cart, auth, wishlist)
- **TanStack React Query 5.17.9** - Server state management & caching

#### Styling & UI
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS 8.4.33** - CSS processing
- **Autoprefixer 10.4.16** - CSS vendor prefixing
- **Lucide React 0.303.0** - Icon library

#### HTTP & SEO
- **Axios 1.6.5** - HTTP client
- **React Helmet Async 2.0.5** - SEO meta tags management

#### Development Tools
- **@vitejs/plugin-react 4.2.1** - Vite React plugin
- **TypeScript** - Type checking

---

## 👨‍💼 Admin Dashboard Technologies

### Admin Panel (`admin/`)

#### Core Framework
- **React 18.2.0** - UI library
- **TypeScript 5.3.3** - Type safety
- **Vite 5.0.11** - Build tool

#### Routing & State
- **React Router DOM 6.21.1** - Routing
- **Zustand 4.4.7** - State management
- **TanStack React Query 5.17.9** - Data fetching & caching

#### Data Visualization
- **Recharts 2.10.3** - Chart library for analytics
  - Line charts, Bar charts, Pie charts, Area charts
  - Used for sales analytics, donation tracking, revenue trends

#### Styling
- **Tailwind CSS 3.4.1** - Styling framework
- **Lucide React 0.303.0** - Icons

#### HTTP
- **Axios 1.6.5** - API communication

---

## ⚙️ Backend Technologies

### API Server (`backend/`)

#### Runtime & Framework
- **Node.js** (v18+) - JavaScript runtime
- **Express 4.18.2** - Web framework
- **TypeScript 5.3.3** - Type safety

#### Database
- **MongoDB 8.0.3** (via Mongoose) - NoSQL database
  - Document-based storage
  - Schema validation
  - Relationships & population

#### Authentication & Security
- **JSON Web Token (JWT) 9.0.2** - Authentication tokens
- **bcryptjs 2.4.3** - Password hashing
- **Helmet 7.1.0** - Security headers
- **express-mongo-sanitize 2.2.0** - NoSQL injection prevention
- **xss-clean 0.1.4** - XSS attack prevention
- **express-rate-limit 7.1.5** - Rate limiting
- **express-validator 7.0.1** - Input validation

#### File Upload
- **Multer 1.4.5-lts.1** - File upload handling

#### Utilities
- **dotenv 16.3.1** - Environment variables
- **cookie-parser 1.4.6** - Cookie parsing
- **cors 2.8.5** - Cross-origin resource sharing
- **compression 1.8.1** - Response compression
- **morgan 1.10.0** - HTTP request logging

#### Development Tools
- **nodemon 3.0.2** - Auto-restart on file changes
- **ts-node 10.9.2** - TypeScript execution
- **dompurify 3.3.0** - HTML sanitization

---

## 🔌 Third-Party Services & Integrations

### Payment Processing
- **Stripe** (configured, ready for integration)
  - Payment intents
  - Webhook support
  - Multiple payment methods (Credit Card, PayPal, Apple Pay, Google Pay)

### Chat Support
- **Tawk.to** - Live chat widget
  - Embedded in frontend
  - 24/7 customer support

### Deployment Platforms
- **Render.com** - Hosting platform
  - Backend API deployment
  - Frontend static hosting
  - Admin dashboard hosting

---

## 🗄️ Database Schema

### MongoDB Collections
- **Users** - Customer & admin accounts
- **Products** - Product catalog
- **Categories** - Product categories (hierarchical)
- **Orders** - Customer orders (includes donations)
- **Reviews** - Product reviews & ratings
- **PetTypes** - Pet type classifications
- **Donations** - Standalone donation records
- **Subscriptions** - Autoship subscriptions

---

## 🔐 Security Features

### Implemented Security Measures
- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting (100 req/10min)
- ✅ XSS protection
- ✅ NoSQL injection prevention
- ✅ Input validation & sanitization
- ✅ CORS configuration
- ✅ Secure HTTP headers (Helmet)
- ✅ Environment variable validation
- ✅ Password expiry for admin/staff
- ✅ Role-based access control (RBAC)

---

## 📊 Development Tools

### Build Tools
- **Vite** - Frontend build tool (fast HMR)
- **TypeScript Compiler** - Backend compilation
- **Concurrently** - Run multiple dev servers

### Code Quality
- **TypeScript** - Static type checking
- **ESLint** (implicit via TypeScript)
- **Prettier** (via editor configs)

### Version Control
- **Git** - Source control
- **GitHub** - Repository hosting

---

## 🌐 Browser Support

### Modern Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Features Used
- ES6+ JavaScript
- CSS Grid & Flexbox
- Fetch API
- LocalStorage
- Modern React Hooks

---

## 📱 Responsive Design

### Breakpoints (Tailwind CSS)
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

### Mobile-First Approach
- Responsive navigation
- Touch-friendly interfaces
- Optimized images
- Mobile menu system

---

## 🚀 Deployment

### Production Environment
- **Node.js** v18+ (backend)
- **MongoDB Atlas** or self-hosted MongoDB
- **Static hosting** for frontend/admin (Vite build)
- **Environment variables** for configuration

### Build Process
```bash
# Frontend
npm run build  # TypeScript check + Vite build

# Admin
npm run build  # TypeScript check + Vite build

# Backend
npm run build  # TypeScript compilation
```

---

## 📈 Performance Optimizations

### Frontend
- Code splitting (React lazy loading)
- Image optimization
- React Query caching
- Zustand state management (lightweight)
- Vite fast HMR

### Backend
- Response compression (Gzip)
- MongoDB indexing
- Query optimization
- Rate limiting
- CORS caching

---

## 🔄 API Architecture

### RESTful API Design
- **Base URL**: `/api`
- **Authentication**: Bearer token (JWT)
- **Response Format**: JSON
- **Error Handling**: Standardized error responses

### API Endpoints
- `/api/auth` - Authentication
- `/api/products` - Product management
- `/api/orders` - Order processing
- `/api/categories` - Category management
- `/api/reviews` - Review system
- `/api/users` - User management
- `/api/donations` - Donation processing
- `/api/pet-types` - Pet type management
- `/api/upload` - File uploads

---

## 📝 Key Libraries & Frameworks Summary

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend Framework** | React | 18.2.0 | UI library |
| **Language** | TypeScript | 5.3.3 | Type safety |
| **Build Tool** | Vite | 5.0.11 | Fast dev server & bundler |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS |
| **Routing** | React Router | 6.21.1 | Client-side routing |
| **State Management** | Zustand | 4.4.7 | Global state |
| **Data Fetching** | React Query | 5.17.9 | Server state & caching |
| **HTTP Client** | Axios | 1.6.5 | API requests |
| **Icons** | Lucide React | 0.303.0 | Icon library |
| **Charts** | Recharts | 2.10.3 | Data visualization |
| **Backend Framework** | Express | 4.18.2 | Web framework |
| **Database** | MongoDB | 8.0.3 | NoSQL database |
| **ODM** | Mongoose | 8.0.3 | MongoDB object modeling |
| **Authentication** | JWT | 9.0.2 | Token-based auth |
| **Password Hashing** | bcryptjs | 2.4.3 | Secure password storage |
| **File Upload** | Multer | 1.4.5 | File handling |
| **Security** | Helmet | 7.1.0 | Security headers |
| **Validation** | express-validator | 7.0.1 | Input validation |

---

## 🎯 Platform Requirements

### Development
- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **MongoDB**: v6 or higher
- **Git**: For version control

### Production
- **Node.js**: v18+ (LTS recommended)
- **MongoDB**: v6+ (Atlas or self-hosted)
- **Web Server**: Nginx or similar (for static files)
- **Process Manager**: PM2 or similar (for Node.js)

---

## 📦 Package Management

- **NPM Workspaces** - Monorepo management
- **NPM** - Package manager
- **Concurrently** - Run multiple scripts

---

## 🔧 Development Workflow

### Local Development
```bash
# Install all dependencies
npm run install:all

# Run all services
npm run dev
# Runs: backend (port 5000), frontend (port 5173), admin (port 5174)
```

### Individual Services
```bash
npm run dev:backend   # Backend API
npm run dev:frontend  # Customer website
npm run dev:admin     # Admin dashboard
```

---

## 📚 Additional Resources

### Documentation
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org
- Tailwind CSS: https://tailwindcss.com
- Express: https://expressjs.com
- MongoDB: https://www.mongodb.com
- Vite: https://vitejs.dev

### Project-Specific Docs
- `README.md` - Main documentation
- `SECURITY.md` - Security practices
- `DONATION_SETUP_GUIDE.md` - Stripe integration guide
- `SECURITY_FIXES_REPORT.md` - Security audit results

---

**Last Updated**: $(date)
**Project Version**: 1.0.0

