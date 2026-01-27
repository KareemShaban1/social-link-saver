@echo off
REM Script to start both frontend and backend in development mode (Windows)

echo 🚀 Starting Social Link Saver Development Servers...
echo.

REM Check if backend node_modules exists
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Check if frontend node_modules exists
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
)

REM Check if backend .env exists
if not exist "backend\.env" (
    echo ⚠️  Warning: backend\.env not found!
    echo Please copy backend\.env.example to backend\.env and configure it
    pause
    exit /b 1
)

REM Check if frontend .env exists
if not exist ".env" (
    echo ⚠️  Warning: .env not found!
    echo Creating .env with default values...
    echo VITE_API_URL=http://localhost:3001/api > .env
)

echo ✅ Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo ✅ Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo 🎉 Both servers are starting!
echo 📡 Backend: http://localhost:3001
echo 🌐 Frontend: http://localhost:5173
echo.
echo Close the command windows to stop the servers
pause
