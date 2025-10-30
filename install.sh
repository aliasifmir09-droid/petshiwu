#!/bin/bash

echo "========================================"
echo "Pet E-Commerce Platform - Installation"
echo "========================================"
echo ""

echo "Step 1: Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install root dependencies"
    exit 1
fi

echo ""
echo "Step 2: Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install backend dependencies"
    exit 1
fi
cd ..

echo ""
echo "Step 3: Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo ""
echo "Step 4: Installing admin dependencies..."
cd admin
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install admin dependencies"
    exit 1
fi
cd ..

echo ""
echo "Step 5: Creating backend .env file..."
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env file created. Please update it with your configuration."
else
    echo ".env file already exists. Skipping..."
fi
cd ..

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running"
echo "2. Update backend/.env with your configuration"
echo "3. Run 'cd backend && npm run seed' to populate database"
echo "4. Run 'npm run dev' to start all services"
echo ""
echo "Admin credentials: admin@petstore.com / admin123"
echo "Customer credentials: customer@example.com / password123"
echo ""



