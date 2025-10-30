@echo off
echo ========================================
echo  Preparing Deployment for cPanel
echo ========================================
echo.

REM Create deployment folder
echo [1/6] Creating deployment folder...
if exist "%USERPROFILE%\Desktop\deployment" rmdir /s /q "%USERPROFILE%\Desktop\deployment"
mkdir "%USERPROFILE%\Desktop\deployment"
mkdir "%USERPROFILE%\Desktop\deployment\public_html"
mkdir "%USERPROFILE%\Desktop\deployment\admin"
mkdir "%USERPROFILE%\Desktop\deployment\backend"
echo Done!
echo.

REM Build Frontend
echo [2/6] Building customer website...
cd frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
cd ..
echo Done!
echo.

REM Build Admin
echo [3/6] Building admin dashboard...
cd admin
call npm run build
if errorlevel 1 (
    echo ERROR: Admin build failed!
    pause
    exit /b 1
)
cd ..
echo Done!
echo.

REM Build Backend
echo [4/6] Building backend API...
cd backend
call npm run build
if errorlevel 1 (
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)
cd ..
echo Done!
echo.

REM Copy files
echo [5/6] Copying files to deployment folder...

REM Copy frontend
xcopy /E /I /Y "frontend\dist\*" "%USERPROFILE%\Desktop\deployment\public_html\"

REM Copy admin
xcopy /E /I /Y "admin\dist\*" "%USERPROFILE%\Desktop\deployment\admin\"

REM Copy backend
xcopy /E /I /Y "backend\dist" "%USERPROFILE%\Desktop\deployment\backend\dist\"
copy /Y "backend\package.json" "%USERPROFILE%\Desktop\deployment\backend\"
xcopy /E /I /Y "backend\uploads" "%USERPROFILE%\Desktop\deployment\backend\uploads\"

echo Done!
echo.

REM Create .htaccess files
echo [6/6] Creating .htaccess files...

REM Frontend .htaccess
(
echo ^<IfModule mod_rewrite.c^>
echo   RewriteEngine On
echo   RewriteBase /
echo   RewriteRule ^\index\.html$ - [L]
echo   RewriteCond %%{REQUEST_FILENAME} !-f
echo   RewriteCond %%{REQUEST_FILENAME} !-d
echo   RewriteRule . /index.html [L]
echo ^</IfModule^>
) > "%USERPROFILE%\Desktop\deployment\public_html\.htaccess"

REM Admin .htaccess
(
echo ^<IfModule mod_rewrite.c^>
echo   RewriteEngine On
echo   RewriteBase /
echo   RewriteRule ^\index\.html$ - [L]
echo   RewriteCond %%{REQUEST_FILENAME} !-f
echo   RewriteCond %%{REQUEST_FILENAME} !-d
echo   RewriteRule . /index.html [L]
echo ^</IfModule^>
) > "%USERPROFILE%\Desktop\deployment\admin\.htaccess"

REM Create example .env file
(
echo # Server Configuration
echo NODE_ENV=production
echo PORT=5000
echo API_URL=https://yourdomain.com/api
echo.
echo # Database - Use your MongoDB Atlas connection string
echo MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/petshop?retryWrites=true^&w=majority
echo.
echo # JWT Secret - Change this to a random secure string
echo JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string-min-32-chars
echo JWT_EXPIRE=7d
echo.
echo # Cookie Settings
echo JWT_COOKIE_EXPIRE=7
echo.
echo # File Upload
echo MAX_FILE_SIZE=5242880
echo FILE_UPLOAD_PATH=/home/yourusername/backend/uploads
echo.
echo # CORS - Your domain
echo CORS_ORIGIN=https://yourdomain.com
echo.
echo # Admin Email
echo ADMIN_EMAIL=admin@petshiwu.com
echo ADMIN_PASSWORD=admin123
) > "%USERPROFILE%\Desktop\deployment\backend\.env.example"

echo Done!
echo.
echo ========================================
echo  Deployment Preparation Complete!
echo ========================================
echo.
echo Deployment files are ready in: %USERPROFILE%\Desktop\deployment
echo.
echo Next Steps:
echo 1. Edit backend\.env.example with your settings
echo 2. Rename it to .env
echo 3. Upload the folders to your cPanel:
echo    - public_html  --^> /public_html/
echo    - admin        --^> /admin/
echo    - backend      --^> /backend/
echo 4. Follow CPANEL_DEPLOYMENT_GUIDE.md for remaining steps
echo.
echo Opening deployment folder...
explorer "%USERPROFILE%\Desktop\deployment"
echo.
pause

