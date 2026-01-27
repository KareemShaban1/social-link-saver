# Social Link Saver - Complete Project Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Key Components](#key-components)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [Installation & Setup](#installation--setup)
9. [Usage Guide](#usage-guide)
10. [Video & Link Preview Features](#video--link-preview-features)
11. [Category Management](#category-management)
12. [Deployment](#deployment)
13. [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

**Social Link Saver** (LinkSaver) is a modern, full-stack web application that allows users to save, organize, and manage their social media links and bookmarks. The application provides a beautiful, intuitive interface for categorizing links, searching through saved content, and previewing links without leaving the page.

### Key Highlights

- **Multi-platform Support**: Save links from Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok, Pinterest, and more
- **Smart Organization**: Hierarchical category system with parent and subcategories
- **Video Detection**: Automatically detects and allows inline viewing of videos from supported platforms
- **Link Preview**: Preview links directly in the application
- **User Authentication**: Secure user accounts with data isolation
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

---

## ✨ Features

### Core Features

1. **Link Management**
   - Add, edit, and delete links
   - Automatic platform detection from URLs
   - Auto-fetch metadata (title, description) from URLs
   - Support for custom titles and descriptions
   - Link validation and error handling

2. **Category System**
   - Create custom categories with color coding
   - Hierarchical categories (parent and subcategories)
   - Visual category indicators
   - Category filtering and organization
   - Drag-and-drop category management (in editor)

3. **Search & Filter**
   - Real-time search across titles, descriptions, and URLs
   - Filter by platform (Facebook, Instagram, YouTube, etc.)
   - Filter by category
   - Combined filters for precise results
   - Clear all filters option

4. **Video Support**
   - Automatic video detection for YouTube, Instagram Reels, TikTok, Facebook Videos, Vimeo
   - Inline video player modal
   - Platform-specific embed handling
   - Fallback options for restricted content

5. **Link Preview**
   - Preview links in modal without leaving the page
   - Platform-aware embedding (only for supported platforms)
   - Copy URL functionality
   - Direct link to open in new tab

6. **User Authentication**
   - Email/password authentication
   - User registration and login
   - Protected routes
   - User-specific data isolation
   - Account management page

7. **Visual Design**
   - Brand-colored platform icons (Facebook blue, Instagram gradient, etc.)
   - Color-coded categories
   - Modern, responsive UI with shadcn/ui components
   - Smooth animations and transitions
   - Dark mode support (via theme system)

---

## 🛠 Technology Stack

### Frontend

- **React 18.3.1** - UI library
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool and dev server
- **React Router 6.30.1** - Client-side routing
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication service
  - Row Level Security (RLS)
  - Real-time subscriptions (available)

### Additional Libraries

- **@tanstack/react-query** - Data fetching and caching
- **date-fns** - Date manipulation
- **class-variance-authority** - Component variants
- **tailwind-merge** - Tailwind class merging
- **clsx** - Conditional class names

---

## 📁 Project Structure

```
social-link-saver/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── AddLinkDialog.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── CategoryHierarchyEditor.tsx
│   │   ├── CategoryManager.tsx
│   │   ├── LinkCard.tsx
│   │   ├── LinkPreview.tsx
│   │   ├── PlatformFilter.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── VideoPlayer.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── integrations/        # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/                 # Utility functions
│   │   ├── urlMetadata.ts
│   │   ├── utils.ts
│   │   └── videoUtils.ts
│   ├── pages/               # Page components
│   │   ├── Account.tsx
│   │   ├── Index.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   └── Signup.tsx
│   ├── assets/              # Static assets
│   │   └── hero-bg.jpg
│   ├── App.tsx              # Main app component
│   ├── App.css
│   ├── index.css            # Global styles
│   └── main.tsx             # Entry point
├── supabase/
│   ├── migrations/          # Database migrations
│   │   ├── 20251114131153_initial_schema.sql
│   │   ├── 20250116000000_convert_to_saas.sql
│   │   └── 20251115125307_add_parent_categories.sql
│   └── config.toml
├── public/                  # Public assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## 🧩 Key Components

### 1. LinkCard Component
**Location**: `src/components/LinkCard.tsx`

Displays individual link cards with:
- Platform icon with brand colors
- Link title and description
- Category badge
- Action buttons (Watch, Show, Visit, Edit, Delete)
- Video detection and Watch button
- Hover effects and animations

**Key Features**:
- Brand-colored platform icons (Facebook blue, Instagram gradient, etc.)
- Conditional Watch button for videos
- Show button for link preview
- Edit and delete functionality
- Category display with hierarchy

### 2. AddLinkDialog Component
**Location**: `src/components/AddLinkDialog.tsx`

Modal dialog for adding/editing links:
- URL input with validation
- Auto-fetch metadata from URL
- Platform auto-detection
- Category selection
- Title and description editing
- Support for creating new categories on-the-fly

**Features**:
- URL validation
- Metadata extraction
- Platform detection
- Category management integration

### 3. CategoryFilter Component
**Location**: `src/components/CategoryFilter.tsx`

Hierarchical category filter with:
- Column-based layout (responsive grid)
- Expandable/collapsible subcategories
- Color-coded categories
- Visual hierarchy with connecting lines
- Select buttons for categories
- "All Categories" option

**Design**:
- Card-based column layout
- Top border accent colors
- Smooth expand/collapse animations
- Badge showing subcategory count

### 4. CategoryHierarchyEditor Component
**Location**: `src/components/CategoryHierarchyEditor.tsx`

Advanced category management:
- Column-based category display
- Expandable subcategories
- Convert categories to parent/subcategory
- Move subcategories between parents
- Edit and delete categories
- Bulk actions (expand/collapse all)

### 5. VideoPlayer Component
**Location**: `src/components/VideoPlayer.tsx`

Modal video player for:
- YouTube videos
- Instagram Reels
- TikTok videos
- Facebook Videos (with restrictions notice)
- Vimeo videos

**Features**:
- Platform-specific embed handling
- Error handling for restricted content
- Fallback messages
- "Open Original" button

### 6. LinkPreview Component
**Location**: `src/components/LinkPreview.tsx`

Link preview modal with:
- Always-visible link information (title, description, URL)
- Conditional iframe preview (only for embeddable platforms)
- Copy URL functionality
- Platform-aware embedding
- Fallback for non-embeddable platforms

### 7. PlatformFilter Component
**Location**: `src/components/PlatformFilter.tsx`

Filter links by platform:
- Visual platform icons
- Multi-select capability
- Clear filter option
- Platform count display

### 8. CategoryManager Component
**Location**: `src/components/CategoryManager.tsx`

Category creation and management:
- Create categories with colors
- Edit existing categories
- Delete categories
- Color picker
- Parent category selection

---

## 🗄 Database Schema

### Tables

#### 1. `categories`
```sql
- id: uuid (PRIMARY KEY)
- name: text (NOT NULL)
- color: text (NOT NULL, DEFAULT '#3b82f6')
- parent_id: uuid (NULLABLE, REFERENCES categories(id))
- user_id: uuid (NULLABLE, REFERENCES auth.users(id))
- created_at: timestamptz (DEFAULT now())
```

#### 2. `links`
```sql
- id: uuid (PRIMARY KEY)
- title: text (NOT NULL)
- url: text (NOT NULL)
- description: text (NULLABLE)
- platform: text (NOT NULL)
- category_id: uuid (NULLABLE, REFERENCES categories(id))
- user_id: uuid (NULLABLE, REFERENCES auth.users(id))
- created_at: timestamptz (DEFAULT now())
```

#### 3. `user_profiles` (SaaS feature)
```sql
- id: uuid (PRIMARY KEY, REFERENCES auth.users(id))
- full_name: text (NULLABLE)
- avatar_url: text (NULLABLE)
- created_at: timestamptz (DEFAULT now())
- updated_at: timestamptz (DEFAULT now())
```

#### 4. `subscription_plans` (SaaS feature)
```sql
- id: uuid (PRIMARY KEY)
- name: text (NOT NULL)
- price_monthly: decimal
- price_yearly: decimal
- max_links: integer
- max_categories: integer
- features: jsonb
```

#### 5. `user_subscriptions` (SaaS feature)
```sql
- id: uuid (PRIMARY KEY)
- user_id: uuid (REFERENCES auth.users(id))
- plan_id: uuid (REFERENCES subscription_plans(id))
- status: text
- current_period_start: timestamptz
- current_period_end: timestamptz
```

### Row Level Security (RLS)

- All tables have RLS enabled
- Users can only access their own data
- Policies enforce user isolation
- Public access removed in SaaS version

---

## 🔐 Authentication & Security

### Authentication System

- **Provider**: Supabase Auth
- **Methods**: Email/Password (OAuth ready)
- **Context**: `AuthContext.tsx` provides global auth state
- **Protected Routes**: `ProtectedRoute.tsx` component

### Security Features

1. **Row Level Security (RLS)**
   - Database-level security
   - User data isolation
   - Automatic filtering by user_id

2. **Protected Routes**
   - Authentication required for main app
   - Redirect to login if not authenticated
   - Public routes: Login, Signup, NotFound

3. **Input Validation**
   - URL validation
   - Form validation with Zod
   - XSS protection via React

4. **Secure API Calls**
   - Supabase client with RLS
   - No direct database access
   - Automatic user context

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git (optional)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd social-link-saver
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Create `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Run Database Migrations

1. Apply migrations in order:
   - `20251114131153_initial_schema.sql` (initial tables)
   - `20251115125307_add_parent_categories.sql` (hierarchical categories)
   - `20250116000000_convert_to_saas.sql` (SaaS features, optional)

2. Via Supabase Dashboard:
   - Go to SQL Editor
   - Run each migration file

3. Or via Supabase CLI:
   ```bash
   supabase db push
   ```

### Step 5: Generate TypeScript Types

```bash
supabase gen types typescript --project-id your_project_id > src/integrations/supabase/types.ts
```

### Step 6: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

---

## 📖 Usage Guide

### Adding a Link

1. Click "Add Link" button
2. Enter or paste the URL
3. Optionally click "Fetch from URL" to auto-fill metadata
4. Edit title and description if needed
5. Select or create a category
6. Click "Add Link"

### Organizing Categories

1. Click "Manage Categories"
2. Create new categories with colors
3. Set parent categories for hierarchy
4. Edit or delete existing categories

### Filtering Links

- **By Category**: Use the category filter (column layout)
- **By Platform**: Use the platform filter buttons
- **By Search**: Type in the search box
- **Combined**: Use multiple filters together

### Watching Videos

1. Links with videos show a "Watch" button
2. Click "Watch" to open video player modal
3. Videos from YouTube, Vimeo embed directly
4. Instagram, TikTok, Facebook may have restrictions

### Previewing Links

1. Click "Show" button on any link card
2. View link information and preview (if embeddable)
3. Copy URL or open in new tab

### Managing Account

1. Navigate to Account page
2. View user profile
3. Manage subscription (if SaaS enabled)
4. Update settings

---

## 🎥 Video & Link Preview Features

### Video Detection

The application automatically detects videos from:
- **YouTube**: All video formats (watch, youtu.be, shorts, embed)
- **Instagram**: Reels and TV posts
- **TikTok**: Video links
- **Facebook**: Videos and Reels (with embedding restrictions)
- **Vimeo**: Video links

### Video Player Features

- Platform-specific embed handling
- Error handling for restricted content
- Fallback messages for blocked embeds
- "Open Original" button for restricted content
- Responsive video player

### Link Preview Features

- Always shows link information (title, description, URL)
- Conditional iframe preview (only for embeddable platforms)
- Copy URL functionality
- Platform-aware embedding
- Graceful fallback for non-embeddable platforms

**Embeddable Platforms**: YouTube, Vimeo, Other (unknown)
**Non-embeddable Platforms**: Facebook, Instagram, Twitter, LinkedIn, TikTok, Pinterest

---

## 📂 Category Management

### Hierarchical Categories

Categories support parent-child relationships:
- **Parent Categories**: Top-level categories
- **Subcategories**: Nested under parent categories
- **Visual Hierarchy**: Indented display with connecting lines
- **Color Coding**: Each category has a unique color

### Category Features

1. **Creation**
   - Name and color selection
   - Optional parent category
   - Automatic user association

2. **Organization**
   - Drag-and-drop in editor
   - Convert between parent/subcategory
   - Move subcategories between parents

3. **Display**
   - Column-based layout in filter
   - Expandable/collapsible subcategories
   - Color-coded badges and borders

4. **Filtering**
   - Filter by parent category
   - Filter by subcategory
   - Visual hierarchy in filter UI

---

## 🎨 Design System

### Color Scheme

- **Primary**: Cyan/Blue (`hsl(195 85% 45%)`)
- **Accent**: Orange (`hsl(16 85% 62%)`)
- **Destructive**: Red (`hsl(0 84.2% 60.2%)`)
- **Muted**: Gray tones for backgrounds

### Platform Brand Colors

- **Facebook**: `#1877F2` (Blue)
- **Instagram**: Gradient (Purple → Red → Orange) with `#E4405F` icon
- **Twitter/X**: `#000000` (Black)
- **LinkedIn**: `#0A66C2` (Blue)
- **YouTube**: `#FF0000` (Red)
- **TikTok**: `#000000` (Black)
- **Pinterest**: `#BD081C` (Red)
- **Reddit**: `#FF4500` (Orange)

### UI Components

Built with **shadcn/ui**:
- Accessible components
- Customizable styling
- Dark mode ready
- Responsive design
- Smooth animations

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy to Lovable

1. Open project in Lovable
2. Click **Share → Publish**
3. Follow deployment prompts

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Environment Variables

Ensure these are set in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🔮 Future Enhancements

### Planned Features

1. **Advanced Search**
   - Full-text search
   - Tag system
   - Date range filtering
   - Saved searches

2. **Export/Import**
   - Export links to CSV/JSON
   - Import from browser bookmarks
   - Backup and restore

3. **Sharing**
   - Share category collections
   - Public link collections
   - Collaboration features

4. **Analytics**
   - Link click tracking
   - Most visited links
   - Category usage stats

5. **Mobile App**
   - React Native app
   - Offline support
   - Push notifications

6. **Browser Extension**
   - Quick save from browser
   - Context menu integration
   - Browser sync

7. **AI Features**
   - Auto-categorization
   - Smart tags
   - Content summarization

8. **Billing Integration** (SaaS)
   - Stripe integration
   - Subscription management
   - Usage limits enforcement

---

## 📝 Development Notes

### Code Style

- TypeScript strict mode
- ESLint for code quality
- Component-based architecture
- Custom hooks for reusable logic

### Best Practices

- Component composition
- Type safety throughout
- Error boundaries
- Loading states
- Optimistic updates

### Testing

- Unit tests (to be added)
- Integration tests (to be added)
- E2E tests (to be added)

---

## 🤝 Contributing

This is a Lovable project. To contribute:

1. Make changes via Lovable interface
2. Or clone and push to repository
3. Changes sync automatically

---

## 📄 License

This project is part of the Lovable platform.

---

## 📞 Support

For issues or questions:
- Check Lovable documentation
- Review Supabase documentation
- Check component documentation in code

---

## 🎉 Acknowledgments

- **shadcn/ui** for beautiful components
- **Supabase** for backend infrastructure
- **Radix UI** for accessible primitives
- **Lucide** for icons
- **Tailwind CSS** for styling

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Active Development
