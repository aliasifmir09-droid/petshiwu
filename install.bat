@echo off
echo ========================================
echo Pet E-Commerce Platform - Installation
echo ========================================
echo.

echo Step 1: Installing root dependencies...
call npm install
if errorlevel 1 (
    echo Error: Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Step 3: Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo Error: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Step 4: Installing admin dependencies...
cd admin
call npm install
if errorlevel 1 (
    echo Error: Failed to install admin dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Step 5: Creating backend .env file...
cd backend
if not exist .env (
    copy .env.example .env
    echo .env file created. Please update it with your configuration.
) else (
    echo .env file already exists. Skipping...
)
cd ..

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Update backend/.env with your configuration
echo 3. Run 'npm run seed' in backend folder to populate database
echo 4. Run 'npm run dev' to start all services
echo.
echo Admin credentials: admin@petstore.com / admin123
echo Customer credentials: customer@example.com / password123
echo.
pause



