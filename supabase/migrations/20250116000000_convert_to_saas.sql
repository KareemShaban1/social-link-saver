-- Convert to SaaS: Add user_id columns and subscription tables

-- Drop old public policies
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public insert to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public update to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public delete to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read access to links" ON public.links;
DROP POLICY IF EXISTS "Allow public insert to links" ON public.links;
DROP POLICY IF EXISTS "Allow public update to links" ON public.links;
DROP POLICY IF EXISTS "Allow public delete to links" ON public.links;

-- Add user_id to categories table
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to links table
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON public.links(user_id);

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric(10, 2) NOT NULL,
  price_yearly numeric(10, 2),
  max_links integer,
  max_categories integer,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE RESTRICT NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (user-specific)
CREATE POLICY "Users can view their own categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for links (user-specific)
CREATE POLICY "Users can view their own links"
  ON public.links FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own links"
  ON public.links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links"
  ON public.links FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links"
  ON public.links FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_subscriptions (user-specific)
CREATE POLICY "Users can view their own subscriptions"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_profiles (user-specific)
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, max_links, max_categories, features) VALUES
  ('Free', 'Perfect for getting started', 0, 0, 50, 10, '["Basic link saving", "Category organization", "Search functionality"]'::jsonb),
  ('Pro', 'For power users', 9.99, 99.99, 1000, 100, '["Unlimited links", "Advanced categories", "Priority support", "Export data"]'::jsonb),
  ('Enterprise', 'For teams and businesses', 29.99, 299.99, -1, -1, '["Everything in Pro", "Team collaboration", "Custom integrations", "Dedicated support"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign free plan by default
  INSERT INTO public.user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  SELECT 
    NEW.id,
    id,
    'active',
    now(),
    now() + INTERVAL '1 month'
  FROM public.subscription_plans
  WHERE name = 'Free'
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
















