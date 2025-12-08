#!/bin/bash

echo "========================================"
echo "  Preparing Deployment for cPanel"
echo "========================================"
echo ""

# Create deployment folder
echo "[1/6] Creating deployment folder..."
rm -rf ~/Desktop/deployment
mkdir -p ~/Desktop/deployment/public_html
mkdir -p ~/Desktop/deployment/admin
mkdir -p ~/Desktop/deployment/backend
echo "Done!"
echo ""

# Build Frontend
echo "[2/6] Building customer website..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed!"
    exit 1
fi
cd ..
echo "Done!"
echo ""

# Build Admin
echo "[3/6] Building admin dashboard..."
cd admin
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Admin build failed!"
    exit 1
fi
cd ..
echo "Done!"
echo ""

# Build Backend
echo "[4/6] Building backend API..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Backend build failed!"
    exit 1
fi
cd ..
echo "Done!"
echo ""

# Copy files
echo "[5/6] Copying files to deployment folder..."

# Copy frontend
cp -r frontend/dist/* ~/Desktop/deployment/public_html/

# Copy admin
cp -r admin/dist/* ~/Desktop/deployment/admin/

# Copy backend
cp -r backend/dist ~/Desktop/deployment/backend/
cp backend/package.json ~/Desktop/deployment/backend/
cp -r backend/uploads ~/Desktop/deployment/backend/

echo "Done!"
echo ""

# Create .htaccess files
echo "[6/6] Creating .htaccess files..."

# Frontend .htaccess (copy from public folder - already configured)
# The .htaccess file is now in frontend/public/.htaccess and will be copied during build
# If it doesn't exist in dist, create it here as fallback
if [ ! -f ~/Desktop/deployment/public_html/.htaccess ]; then
  cat > ~/Desktop/deployment/public_html/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files or directories that exist
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Don't rewrite API calls
  RewriteCond %{REQUEST_URI} !^/api/
  
  # Rewrite everything else to index.html for SPA routing
  RewriteRule . /index.html [L]
</IfModule>
EOF
fi

# Admin .htaccess
cat > ~/Desktop/deployment/admin/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF

# Create example .env file
cat > ~/Desktop/deployment/backend/.env.example << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=5000
API_URL=https://yourdomain.com/api

# Database - Use your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/petshop?retryWrites=true&w=majority

# JWT Secret - Change this to a random secure string
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string-min-32-chars
JWT_EXPIRE=7d

# Cookie Settings
JWT_COOKIE_EXPIRE=7

# File Upload
MAX_FILE_SIZE=5242880
FILE_UPLOAD_PATH=/home/yourusername/backend/uploads

# CORS - Your domain
CORS_ORIGIN=https://yourdomain.com

# Admin Email
ADMIN_EMAIL=admin@petshiwu.com
ADMIN_PASSWORD=admin123
EOF

echo "Done!"
echo ""
echo "========================================"
echo "  Deployment Preparation Complete!"
echo "========================================"
echo ""
echo "Deployment files are ready in: ~/Desktop/deployment"
echo ""
echo "Next Steps:"
echo "1. Edit backend/.env.example with your settings"
echo "2. Rename it to .env"
echo "3. Upload the folders to your cPanel:"
echo "   - public_html  --> /public_html/"
echo "   - admin        --> /admin/"
echo "   - backend      --> /backend/"
echo "4. Follow CPANEL_DEPLOYMENT_GUIDE.md for remaining steps"
echo ""
echo "Opening deployment folder..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open ~/Desktop/deployment
else
    xdg-open ~/Desktop/deployment 2>/dev/null || echo "Folder: ~/Desktop/deployment"
fi
echo ""

