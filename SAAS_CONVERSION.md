# SaaS Conversion Guide

This document outlines the changes made to convert the Social Link Saver project into a SaaS (Software as a Service) application.

## Changes Made

### 1. Database Migration
- **File**: `supabase/migrations/20250116000000_convert_to_saas.sql`
- Added `user_id` columns to `categories` and `links` tables
- Created `subscription_plans` table for managing subscription tiers
- Created `user_subscriptions` table for tracking user subscriptions
- Created `user_profiles` table for user profile information
- Updated Row Level Security (RLS) policies to enforce user isolation
- Added automatic profile creation trigger on user signup
- Added default subscription plans (Free, Pro, Enterprise)

### 2. Authentication System
- **File**: `src/contexts/AuthContext.tsx`
- Created authentication context provider
- Manages user session and authentication state
- Provides `useAuth` hook for accessing user data

### 3. Protected Routes
- **File**: `src/components/ProtectedRoute.tsx`
- Component that protects routes requiring authentication
- Redirects unauthenticated users to login page

### 4. Authentication Pages
- **File**: `src/pages/Login.tsx` - User login page
- **File**: `src/pages/Signup.tsx` - User registration page
- **File**: `src/pages/Account.tsx` - User account management page

### 5. Updated Components
- **Index.tsx**: Now filters data by `user_id` and includes navigation
- **AddLinkDialog.tsx**: Includes `user_id` when creating links
- **CategoryManager.tsx**: Includes `user_id` when creating categories
- All database queries now filter by authenticated user

### 6. Routing Updates
- **App.tsx**: Added authentication routes and protected routes
- Login and signup pages are publicly accessible
- Main app and account pages require authentication

## Next Steps

### 1. Run Database Migration
You need to apply the database migration to your Supabase project:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually through Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/20250116000000_convert_to_saas.sql
```

### 2. Regenerate TypeScript Types
After running the migration, regenerate your TypeScript types:

```bash
# If using Supabase CLI
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Or use the Supabase Dashboard to generate types
```

### 3. Configure Supabase Authentication
1. Go to your Supabase Dashboard
2. Navigate to Authentication > Settings
3. Configure email authentication (should be enabled by default)
4. Optionally configure OAuth providers (Google, GitHub, etc.)

### 4. Test the Application
1. Start the development server: `npm run dev`
2. Try signing up a new user
3. Verify that:
   - Users can only see their own links and categories
   - Data is properly isolated between users
   - Authentication works correctly

### 5. Optional: Set Up Billing Integration
For a complete SaaS solution, you may want to integrate a payment provider:
- **Stripe**: Most popular choice for subscriptions
- **Paddle**: Alternative with built-in tax handling
- **LemonSqueezy**: Simple subscription management

You'll need to:
1. Create webhook endpoints to handle subscription events
2. Update subscription status in the database
3. Enforce subscription limits (max_links, max_categories)

## Subscription Plans

The migration includes three default subscription plans:

1. **Free Plan**
   - Price: $0/month
   - Max Links: 50
   - Max Categories: 10
   - Features: Basic link saving, category organization, search

2. **Pro Plan**
   - Price: $9.99/month ($99.99/year)
   - Max Links: 1,000
   - Max Categories: 100
   - Features: Everything in Free + Unlimited links, advanced categories, priority support, export data

3. **Enterprise Plan**
   - Price: $29.99/month ($299.99/year)
   - Max Links: Unlimited
   - Max Categories: Unlimited
   - Features: Everything in Pro + Team collaboration, custom integrations, dedicated support

## Security Features

- **Row Level Security (RLS)**: All tables have RLS enabled
- **User Isolation**: Users can only access their own data
- **Authentication Required**: All protected routes require authentication
- **Secure Session Management**: Uses Supabase's built-in session management

## Important Notes

1. **Existing Data**: If you have existing data in your database, you'll need to migrate it:
   - Assign existing categories and links to a default user
   - Or delete existing data before running the migration

2. **Email Verification**: By default, Supabase requires email verification. You may want to disable this for development:
   - Go to Authentication > Settings > Email Auth
   - Toggle "Confirm email" off for development

3. **Type Safety**: After running the migration, make sure to regenerate TypeScript types to get proper type checking for the new `user_id` fields.

## Troubleshooting

### Users can't see their data
- Check that RLS policies are enabled
- Verify that `user_id` is being set correctly when creating records
- Check browser console for authentication errors

### Migration fails
- Ensure you have proper permissions in Supabase
- Check that the migration file is valid SQL
- Review Supabase logs for specific error messages

### Authentication not working
- Verify Supabase URL and keys in `.env` file
- Check that email authentication is enabled in Supabase Dashboard
- Review browser console for authentication errors
















