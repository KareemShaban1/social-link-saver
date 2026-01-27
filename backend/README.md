# Social Link Saver - Express.js Backend

This is the Express.js backend for the Social Link Saver application, using Prisma ORM with MySQL database.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ database
- Git

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/social_link_saver"
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

4. **Set up MySQL database**
   ```sql
   CREATE DATABASE social_link_saver;
   ```

5. **Run Prisma migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

7. **Seed database (optional)**
   ```bash
   npm run prisma:seed
   ```

8. **Start development server**
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3001`

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Prisma schema definition
│   └── seed.ts                # Database seeding script
├── src/
│   ├── lib/
│   │   └── prisma.ts          # Prisma client instance
│   ├── middleware/
│   │   ├── auth.middleware.ts # JWT authentication middleware
│   │   └── errorHandler.ts    # Error handling middleware
│   ├── routes/
│   │   ├── auth.routes.ts     # Authentication routes
│   │   ├── link.routes.ts     # Link CRUD routes
│   │   ├── category.routes.ts # Category CRUD routes
│   │   └── user.routes.ts     # User profile routes
│   └── server.ts              # Express server entry point
├── .env.example               # Environment variables template
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Links

- `GET /api/links` - Get all links (with optional filters: categoryId, platform, search)
- `GET /api/links/:id` - Get single link
- `POST /api/links` - Create new link
- `PUT /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Server returns a JWT token
3. Client includes token in `Authorization: Bearer <token>` header
4. Protected routes verify token via `authenticate` middleware

## 🗄️ Database Schema

### Users
- `id` (UUID)
- `email` (unique)
- `password` (hashed)
- `fullName`
- `avatarUrl`
- `createdAt`, `updatedAt`

### Categories
- `id` (UUID)
- `name`
- `color`
- `parentId` (nullable, for hierarchy)
- `userId`
- `createdAt`

### Links
- `id` (UUID)
- `title`
- `url`
- `description`
- `platform`
- `categoryId` (nullable)
- `userId`
- `createdAt`

### Subscription Plans
- `id` (UUID)
- `name`
- `description`
- `priceMonthly`, `priceYearly`
- `maxLinks`, `maxCategories`
- `features` (JSON)

### User Subscriptions
- `id` (UUID)
- `userId` (unique)
- `planId`
- `status` (ACTIVE, CANCELED, PAST_DUE, TRIALING)
- `currentPeriodStart`, `currentPeriodEnd`
- `cancelAtPeriodEnd`

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with sample data

### Database Migrations

Create a new migration:
```bash
npx prisma migrate dev --name migration_name
```

Apply migrations:
```bash
npx prisma migrate deploy
```

### Prisma Studio

View and edit database data:
```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

## 🔒 Security

- Passwords are hashed using bcryptjs
- JWT tokens expire after 7 days (configurable)
- All routes except auth require authentication
- User data is isolated (users can only access their own data)
- Input validation using express-validator
- CORS configured for frontend URL

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🚢 Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   - Use strong `JWT_SECRET`
   - Set `NODE_ENV=production`
   - Configure production database URL
   - Set correct `FRONTEND_URL`

3. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start server**
   ```bash
   npm start
   ```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `DATABASE_URL` format: `mysql://user:password@host:port/database`
- Ensure database exists
- Check user permissions

### Migration Issues
- Ensure database is empty or use `--create-only` flag
- Check Prisma schema syntax
- Verify database user has CREATE/ALTER permissions

### Authentication Issues
- Verify `JWT_SECRET` is set
- Check token expiration
- Ensure frontend sends token in Authorization header

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
