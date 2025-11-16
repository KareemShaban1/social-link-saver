-- Create categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create links table
CREATE TABLE public.links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  description text,
  platform text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Allow public read access to categories"
  ON public.categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to categories"
  ON public.categories FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to categories"
  ON public.categories FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete to categories"
  ON public.categories FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to links"
  ON public.links FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to links"
  ON public.links FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to links"
  ON public.links FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete to links"
  ON public.links FOR DELETE
  TO public
  USING (true);

-- Insert default categories
INSERT INTO public.categories (name, color) VALUES
  ('Social Media', '#ec4899'),
  ('Articles', '#3b82f6'),
  ('Videos', '#ef4444'),
  ('Shopping', '#10b981'),
  ('Inspiration', '#f59e0b');