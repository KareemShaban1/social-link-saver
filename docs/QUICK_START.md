# Quick Start Guide

Get the Social Link Saver application running in 5 minutes!

## 🚀 Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ installed and running
- npm or yarn

## ⚡ Quick Setup

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 3. Set Up MySQL Database

```bash
mysql -u root -p
```

Then run:
```sql
CREATE DATABASE social_link_saver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4. Configure Environment Variables

**Frontend** (root directory):
```bash
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

**Backend** (backend directory):
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/social_link_saver"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### 5. Initialize Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
# When prompted, enter migration name: "init"
npm run prisma:seed
cd ..
```

### 6. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 7. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Prisma Studio: Run `cd backend && npm run prisma:studio` (optional)

## 🧪 Test Credentials

After seeding, you can login with:
- Email: `test@example.com`
- Password: `password123`

## ✅ Verify Installation

1. Open http://localhost:5173
2. Click "Sign up" or use test credentials
3. Create a category
4. Add a link
5. Verify everything works!

## 🐛 Troubleshooting

### Backend won't start
- Check MySQL is running: `mysql -u root -p`
- Verify DATABASE_URL in `backend/.env`
- Ensure database exists

### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check `VITE_API_URL` in root `.env`
- Check browser console for CORS errors

### Database migration fails
- Ensure database is empty or doesn't exist
- Check MySQL user has CREATE privileges
- Verify DATABASE_URL format

## 📚 Next Steps

- Read [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed backend setup
- Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) if migrating from Supabase
- Read [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for full documentation

## 🎉 You're Ready!

Your application is now running with Express.js + Prisma + MySQL backend!
