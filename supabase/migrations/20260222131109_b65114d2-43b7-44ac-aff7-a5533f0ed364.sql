
-- Create categories table for dynamic category management
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_bn text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '📦',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default categories
INSERT INTO public.categories (slug, name, name_bn, icon, sort_order) VALUES
  ('phones', 'Smartphones', 'স্মার্টফোন', '📱', 1),
  ('earbuds', 'Earbuds & Audio', 'ইয়ারবাড ও অডিও', '🎧', 2),
  ('smartwatches', 'Smart Watches', 'স্মার্ট ওয়াচ', '⌚', 3),
  ('chargers', 'Chargers & Cables', 'চার্জার ও ক্যাবল', '🔌', 4),
  ('cases', 'Cases & Covers', 'কেস ও কভার', '🛡️', 5),
  ('powerbanks', 'Power Banks', 'পাওয়ার ব্যাংক', '🔋', 6);
