# Migration Guide: Supabase to Express.js + Prisma + MySQL

This guide explains how to migrate from Supabase to Express.js backend with Prisma and MySQL.

## 📋 Overview

The application has been converted from:
- **Backend**: Supabase → Express.js
- **Database**: PostgreSQL (Supabase) → MySQL
- **ORM**: Supabase Client → Prisma ORM
- **Authentication**: Supabase Auth → JWT with Express

## 🔄 What Changed

### Backend Structure

**Before (Supabase)**:
- Direct database access via Supabase client
- Row Level Security (RLS) policies
- Supabase Auth for authentication

**After (Express.js)**:
- RESTful API with Express.js
- Prisma ORM for database operations
- JWT-based authentication
- MySQL database

### Frontend Changes

**Before**:
```typescript
import { supabase } from "@/integrations/supabase/client";
const { data } = await supabase.from("links").select("*");
```

**After**:
```typescript
import { api } from "@/lib/api";
const { links } = await api.getLinks();
```

## 🚀 Migration Steps

### 1. Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` for MySQL
   - Set `JWT_SECRET`
   - Configure `FRONTEND_URL`

4. **Create MySQL database**
   ```sql
   CREATE DATABASE social_link_saver;
   ```

5. **Run migrations**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

6. **Start backend server**
   ```bash
   npm run dev
   ```

### 2. Frontend Configuration

1. **Update environment variables**
   Create/update `.env` in root:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

2. **Remove Supabase dependencies** (optional)
   ```bash
   npm uninstall @supabase/supabase-js
   ```

3. **Start frontend**
   ```bash
   npm run dev
   ```

### 3. Data Migration (if needed)

If you have existing data in Supabase:

1. **Export data from Supabase**
   - Use Supabase dashboard or SQL editor
   - Export `categories` and `links` tables

2. **Transform data format**
   - Convert UUIDs if needed
   - Map `user_id` to new user IDs
   - Adjust date formats

3. **Import to MySQL**
   - Use Prisma Studio or MySQL client
   - Import transformed data

## 📝 Code Changes Summary

### Authentication

**Before**:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**After**:
```typescript
const { user, token } = await api.login(email, password);
```

### Data Fetching

**Before**:
```typescript
const { data } = await supabase
  .from("links")
  .select("*")
  .eq("user_id", user.id);
```

**After**:
```typescript
const { links } = await api.getLinks();
```

### Creating Records

**Before**:
```typescript
const { error } = await supabase
  .from("links")
  .insert({ title, url, platform, user_id: user.id });
```

**After**:
```typescript
await api.createLink({ title, url, platform });
```

## 🔑 Key Differences

### 1. Authentication
- **Supabase**: Automatic session management
- **Express**: Manual JWT token management in localStorage

### 2. Data Access
- **Supabase**: Direct database queries with RLS
- **Express**: API endpoints with authentication middleware

### 3. Error Handling
- **Supabase**: Error objects in responses
- **Express**: HTTP status codes + error messages

### 4. Real-time (if used)
- **Supabase**: Built-in real-time subscriptions
- **Express**: Would need WebSocket implementation (not included)

## 🧪 Testing the Migration

1. **Test Authentication**
   - Register new user
   - Login
   - Verify token is stored

2. **Test CRUD Operations**
   - Create link
   - Read links
   - Update link
   - Delete link

3. **Test Categories**
   - Create category
   - Create subcategory
   - Update hierarchy

4. **Test User Isolation**
   - Create user A, add links
   - Create user B, verify can't see user A's links

## ⚠️ Breaking Changes

1. **No more Supabase client** - All database access goes through API
2. **Manual token management** - Frontend must handle JWT tokens
3. **Different error format** - API returns different error structure
4. **No real-time updates** - Need to refresh or implement polling/WebSockets

## 🔧 Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
- Check CORS middleware configuration

### Authentication Fails
- Verify JWT_SECRET is set
- Check token expiration
- Ensure token is sent in Authorization header

### Database Connection
- Verify MySQL is running
- Check DATABASE_URL format
- Ensure database exists

### API Not Found
- Verify backend is running on correct port
- Check VITE_API_URL in frontend .env
- Verify API routes are correct

## 📚 Next Steps

1. **Remove Supabase dependencies** (optional cleanup)
2. **Update documentation** with new API endpoints
3. **Add API rate limiting** (recommended)
4. **Implement request logging** (recommended)
5. **Add API documentation** (Swagger/OpenAPI)
6. **Set up monitoring** (error tracking, analytics)

## 🆘 Support

If you encounter issues:
1. Check backend logs
2. Verify environment variables
3. Test API endpoints with Postman/curl
4. Check Prisma Studio for database state
5. Review error messages in browser console
