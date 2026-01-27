# Backend Setup Guide

Complete guide for setting up the Express.js + Prisma + MySQL backend.

## 📋 Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ installed and running
- npm or yarn package manager

## 🔧 Step-by-Step Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure MySQL Database

Create a MySQL database:

```sql
CREATE DATABASE social_link_saver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Create a MySQL user (optional, can use root):

```sql
CREATE USER 'linkuser'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON social_link_saver.* TO 'linkuser'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Connection
DATABASE_URL="mysql://linkuser:your_password@localhost:3306/social_link_saver"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

**Important**: 
- Replace `your_password` with your MySQL password
- Use a strong, random `JWT_SECRET` (at least 32 characters)
- Update `FRONTEND_URL` if your frontend runs on a different port

### 4. Run Database Migrations

Generate Prisma Client and create database tables:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate
```

When prompted, enter a migration name (e.g., "init").

### 5. Seed Database (Optional)

Populate database with sample data:

```bash
npm run prisma:seed
```

This creates:
- Default subscription plans (Free, Pro, Enterprise)
- A test user (email: `test@example.com`, password: `password123`)
- Default categories for the test user

### 6. Start Development Server

```bash
npm run dev
```

The server should start on `http://localhost:3001`

You should see:
```
🚀 Server running on http://localhost:3001
📡 Frontend URL: http://localhost:5173
```

## 🧪 Verify Installation

### Test Health Endpoint

```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","timestamp":"2025-01-26T..."}
```

### Test Registration

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'
```

Should return user data and token.

## 📊 Database Management

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

Opens a GUI at `http://localhost:5555` to view and edit database records.

### Create New Migration

After changing `schema.prisma`:

```bash
npm run prisma:migrate
```

### Reset Database (⚠️ Deletes all data)

```bash
npx prisma migrate reset
```

## 🔍 Troubleshooting

### Issue: Cannot connect to database

**Solution**:
1. Verify MySQL is running: `mysql -u root -p`
2. Check DATABASE_URL format: `mysql://user:password@host:port/database`
3. Ensure database exists
4. Verify user has permissions

### Issue: Migration fails

**Solution**:
1. Check Prisma schema syntax
2. Ensure database is empty or use `--create-only` flag
3. Check MySQL user permissions
4. Verify database charset is utf8mb4

### Issue: JWT errors

**Solution**:
1. Ensure JWT_SECRET is set in .env
2. Use a strong secret (32+ characters)
3. Restart server after changing JWT_SECRET

### Issue: CORS errors

**Solution**:
1. Verify FRONTEND_URL matches your frontend URL
2. Check backend is running
3. Verify frontend VITE_API_URL is correct

## 🚀 Production Deployment

### 1. Build for Production

```bash
npm run build
```

### 2. Set Production Environment

Update `.env`:
```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@production-host:3306/social_link_saver
JWT_SECRET=strong-production-secret
FRONTEND_URL=https://your-frontend-domain.com
```

### 3. Run Migrations

```bash
npx prisma migrate deploy
```

### 4. Start Server

```bash
npm start
```

### Recommended Production Setup

- Use PM2 or similar process manager
- Set up reverse proxy (Nginx)
- Enable HTTPS
- Configure firewall
- Set up database backups
- Monitor logs and errors
- Use environment-specific configs

## 📝 API Testing

### Using curl

**Register**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","fullName":"John Doe"}'
```

**Login**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Get Links** (with token):
```bash
curl http://localhost:3001/api/links \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import collection (create from API routes)
2. Set base URL: `http://localhost:3001/api`
3. Register/Login to get token
4. Set token in Authorization header for protected routes

## 🔐 Security Checklist

- [ ] Strong JWT_SECRET (32+ characters)
- [ ] Database user has minimal required permissions
- [ ] CORS configured for specific frontend URL
- [ ] Environment variables not committed to git
- [ ] HTTPS in production
- [ ] Rate limiting (recommended)
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info

## 📚 Additional Resources

- [Prisma MySQL Guide](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
