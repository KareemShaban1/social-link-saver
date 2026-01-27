# Social Link Saver

A modern web application for saving, organizing, and managing social media links with a beautiful, intuitive interface.

## 🏗️ Architecture

This project consists of two main parts:

### Frontend (React + Vite)
- **Location**: Root directory
- **Framework**: React 18 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **State**: React Context + Custom Hooks

### Backend (Express.js + Prisma + MySQL)
- **Location**: `backend/` directory
- **Framework**: Express.js + TypeScript
- **ORM**: Prisma
- **Database**: MySQL
- **Authentication**: JWT

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ (for backend)
- Git

### Frontend Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set VITE_API_URL=http://localhost:3001/api

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MySQL connection and JWT secret

# Create MySQL database
mysql -u root -p
CREATE DATABASE social_link_saver;

# Run migrations
npm run prisma:migrate
npm run prisma:generate

# Start backend server
npm run dev
```

Backend runs on `http://localhost:3001`

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed backend setup instructions.

## 📚 Documentation

- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete project documentation
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Guide for migrating from Supabase
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Detailed backend setup guide
- **[backend/README.md](./backend/README.md)** - Backend API documentation

## 🛠️ Technologies

### Frontend
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **React 18** - UI library
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Hook Form** - Form management

### Backend
- **Express.js** - Web framework
- **Prisma** - ORM
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## 📁 Project Structure

```
social-link-saver/
├── backend/              # Express.js backend
│   ├── prisma/          # Prisma schema and migrations
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── middleware/ # Express middleware
│   │   └── server.ts    # Server entry point
│   └── package.json
├── src/                  # React frontend
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── lib/             # Utilities and API client
│   └── contexts/        # React contexts
└── package.json
```

## 🔑 Key Features

- ✅ User authentication (JWT)
- ✅ Link management (CRUD)
- ✅ Category system with hierarchy
- ✅ Platform detection and filtering
- ✅ Video detection and inline playback
- ✅ Link preview functionality
- ✅ Search and filter capabilities
- ✅ Responsive design

## 🔐 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend (backend/.env)
```env
DATABASE_URL=mysql://user:password@localhost:3306/social_link_saver
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## 📝 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server (in backend/)
- `npm run build` - Build for production
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## 🚢 Deployment

### Frontend
Deploy the built `dist/` folder to any static hosting:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static file server

### Backend
Deploy to:
- Railway
- Render
- AWS EC2
- DigitalOcean
- Heroku
- Any Node.js hosting

Ensure MySQL database is accessible from your hosting provider.

## 🤝 Contributing

This is a Lovable project. To contribute:

1. Make changes via Lovable interface, or
2. Clone repo and push changes
3. Changes sync automatically

## 📄 License

This project is part of the Lovable platform.

## 🔗 Links

- [Lovable Project](https://lovable.dev/projects/16a558da-5660-4e43-876c-661130c3a032)
- [Project Documentation](./PROJECT_DOCUMENTATION.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
