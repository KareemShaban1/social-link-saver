#!/bin/bash

# Script to start both frontend and backend in development mode

echo "🚀 Starting Social Link Saver Development Servers..."
echo ""

# Check if backend node_modules exists
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Check if frontend node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found!"
    echo "Please copy backend/.env.example to backend/.env and configure it"
    exit 1
fi

# Check if frontend .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env not found!"
    echo "Creating .env with default values..."
    echo "VITE_API_URL=http://localhost:3001/api" > .env
fi

echo "✅ Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
sleep 3

echo "✅ Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Both servers are starting!"
echo "📡 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
