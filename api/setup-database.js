export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { accessToken, projectRef, email, password } = req.body || {};
    if (!accessToken || !projectRef) return res.status(400).json({ error: "Missing accessToken or projectRef" });

    const runQuery = async (sql) => {
      const r = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ query: sql }),
      });
      if (!r.ok) { const text = await r.text(); throw new Error(`API error ${r.status}: ${text}`); }
      return r.json();
    };

    // Step 1: Tables & functions
    await runQuery(`
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') $fn$;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;

DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $fn$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $fn$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL, UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, name_bn text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '', description_bn text NOT NULL DEFAULT '',
  price integer NOT NULL, original_price integer, discount integer,
  image text NOT NULL DEFAULT '', category text NOT NULL DEFAULT 'phones',
  brand text NOT NULL DEFAULT '', in_stock boolean NOT NULL DEFAULT true,
  is_new boolean NOT NULL DEFAULT false, is_bestseller boolean NOT NULL DEFAULT false,
  rating numeric NOT NULL DEFAULT 4.0, reviews integer NOT NULL DEFAULT 0,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL, customer_name text NOT NULL,
  customer_phone text NOT NULL, customer_address text NOT NULL,
  customer_city text NOT NULL DEFAULT 'Dhaka', payment_method text NOT NULL DEFAULT 'cod',
  bkash_number text, transaction_id text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal integer NOT NULL DEFAULT 0, shipping integer NOT NULL DEFAULT 0, total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL, value text NOT NULL DEFAULT ''
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL, title text NOT NULL, title_bn text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL, name text NOT NULL, name_bn text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '📦', sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
    `);

    // Step 2: has_role, policies, seed data
    await runQuery(`
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $fn$;

DO $$ BEGIN CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Anyone can read orders by order_number or phone" ON public.orders FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Anyone can read pages" ON public.pages FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.site_settings (key, value)
SELECT * FROM (VALUES
  ('siteName','NexaMart'),('bkashNumber','01XXXXXXXXX'),('freeShippingMin','5000'),
  ('dhakaShipping','60'),('outsideShipping','150'),('contactPhone','+880 1XXX-XXXXXX'),
  ('contactEmail','info@nexamart.com'),
  ('site_name','NexaMart'),('site_tagline','Your Trusted Gadget Store'),
  ('nav_link_1','Home'),('nav_link_1_url','/'),
  ('nav_link_2','All Products'),('nav_link_2_url','/products'),
  ('nav_link_3','Phones'),('nav_link_3_url','/products?category=phones'),
  ('nav_link_4','Audio'),('nav_link_4_url','/products?category=earbuds'),
  ('nav_link_5','Track Order'),('nav_link_5_url','/track-order'),
  ('hero_badge','🇧🇩 বাংলাদেশে #১ গ্যাজেট শপ'),
  ('hero_title_1','Premium Gadgets,'),('hero_title_2','Best Prices'),
  ('hero_description','অরিজিনাল ফোন, ইয়ারবাড, স্মার্টওয়াচ এবং আরও অনেক কিছু। সারাদেশে দ্রুত ডেলিভারি।'),
  ('hero_btn_primary','কিনুন – Shop Now'),('hero_btn_primary_url','/products'),
  ('hero_btn_secondary','Browse Phones'),('hero_btn_secondary_url','/products?category=phones'),
  ('trust_1_label','ঢাকায় ফ্রি ডেলিভারি'),('trust_1_sub','Free delivery in Dhaka'),
  ('trust_2_label','১০০% অরিজিনাল'),('trust_2_sub','Genuine products guaranteed'),
  ('trust_3_label','২৪/৭ সাপোর্ট'),('trust_3_sub','Always here to help'),
  ('categories_title','Shop by Category'),('categories_subtitle','আপনার পছন্দের ক্যাটেগরি বেছে নিন'),
  ('bestsellers_title','Bestsellers 🔥'),('bestsellers_subtitle','সবচেয়ে জনপ্রিয় পণ্য'),
  ('promo_label','Limited Time Offer'),('promo_title','Up to 30% Off on Audio'),
  ('promo_description','সেরা ইয়ারবাড এবং হেডফোনে বিশাল ছাড়! সীমিত সময়ের জন্য।'),
  ('promo_btn','Shop Audio Deals'),('promo_btn_url','/products?category=earbuds'),
  ('footer_description','বাংলাদেশের সবচেয়ে বিশ্বস্ত গ্যাজেট শপ। অরিজিনাল পণ্য, দ্রুত ডেলিভারি।'),
  ('footer_quicklinks_title','Quick Links'),
  ('footer_ql_1','All Products'),('footer_ql_1_url','/products'),
  ('footer_ql_2','Smartphones'),('footer_ql_2_url','/products?category=phones'),
  ('footer_ql_3','Earbuds & Audio'),('footer_ql_3_url','/products?category=earbuds'),
  ('footer_ql_4','Track Order'),('footer_ql_4_url','/track-order'),
  ('footer_support_title','Support'),
  ('footer_sp_1','Shipping Policy'),('footer_sp_1_url','/page/shipping-policy'),
  ('footer_sp_2','Return & Refund'),('footer_sp_2_url','/page/return-refund'),
  ('footer_sp_3','Privacy Policy'),('footer_sp_3_url','/page/privacy-policy'),
  ('footer_sp_4','Terms of Service'),('footer_sp_4_url','/page/terms-of-service'),
  ('contact_title','Contact'),
  ('contact_phone','+880 1700-000000'),('contact_email','support@nexamart.com'),
  ('contact_address','Gulshan, Dhaka 1212'),('copyright_text','© 2026 NexaMart. All rights reserved.'),
  ('bkash_number','01XXXXXXXXX'),('free_shipping_min','5000'),('dhaka_shipping','60'),('outside_shipping','150'),
  ('product_add_to_cart','Add to Cart'),('product_buy_now','Buy Now'),
  ('product_in_stock','In Stock'),('product_out_of_stock','Out of Stock'),
  ('product_specs_title','Specifications'),('product_related_title','Related Products'),
  ('checkout_title','Checkout'),('order_success_title','Order Placed Successfully!'),
  ('order_success_msg','Thank you for your order. You will receive a confirmation shortly.'),
  ('track_order_title','Track Your Order'),('track_order_placeholder','Enter your order number or phone number'),
  ('payment_methods','[{"id":"bkash","name":"bKash","number":"01XXXXXXXXX","instructions":"Send Money to the number above, then enter your bKash number and Transaction ID.","color":"#E2136E"},{"id":"cod","name":"Cash on Delivery","number":"","instructions":"ডেলিভারির সময় ক্যাশ দিয়ে পেমেন্ট করুন। অতিরিক্ত কোনো চার্জ নেই।","color":""}]')
) AS v(key,value)
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE site_settings.key = v.key);

INSERT INTO public.pages (slug, title, title_bn, content)
SELECT * FROM (VALUES
  ('privacy-policy','Privacy Policy','গোপনীয়তা নীতি','Your privacy policy content here.'),
  ('terms-of-service','Terms of Service','সেবার শর্তাবলী','Your terms of service content here.'),
  ('return-policy','Return Policy','রিটার্ন নীতি','Your return policy content here.'),
  ('about-us','About Us','আমাদের সম্পর্কে','About us content here.'),
  ('shipping-policy','Shipping Policy','শিপিং নীতি','Your shipping policy content here.')
) AS v(slug,title,title_bn,content)
WHERE NOT EXISTS (SELECT 1 FROM public.pages WHERE pages.slug = v.slug);

INSERT INTO public.categories (slug, name, name_bn, icon, sort_order)
SELECT * FROM (VALUES
  ('phones','Smartphones','স্মার্টফোন','📱',1),
  ('earbuds','Earbuds & Audio','ইয়ারবাড ও অডিও','🎧',2),
  ('smartwatches','Smart Watches','স্মার্ট ওয়াচ','⌚',3),
  ('chargers','Chargers & Cables','চার্জার ও ক্যাবল','🔌',4),
  ('cases','Cases & Covers','কেস ও কভার','🛡️',5),
  ('powerbanks','Power Banks','পাওয়ার ব্যাংক','🔋',6)
) AS v(slug,name,name_bn,icon,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE categories.slug = v.slug);
    `);

    // Step 3: Admin user (optional)
    if (email && password) {
      const apiKeysRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!apiKeysRes.ok) throw new Error("Failed to fetch API keys");
      const apiKeys = await apiKeysRes.json();
      const serviceKey = apiKeys.find((k) => k.name === "service_role")?.api_key;
      if (!serviceKey) throw new Error("Service role key not found");

      const projectUrl = `https://${projectRef}.supabase.co`;
      const createRes = await fetch(`${projectUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ email, password, email_confirm: true }),
      });

      let userId;
      if (createRes.ok) {
        userId = (await createRes.json()).id;
      } else {
        const errData = await createRes.json();
        if (errData.msg?.includes("already been registered") || errData.message?.includes("already been registered")) {
          const listRes = await fetch(`${projectUrl}/auth/v1/admin/users`, {
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
          });
          const listData = await listRes.json();
          const existing = listData.users?.find((u) => u.email === email);
          if (!existing) throw new Error("User exists but could not find ID");
          userId = existing.id;
        } else {
          throw new Error(errData.msg || errData.message || "Failed to create user");
        }
      }

      if (userId) {
        await runQuery(`INSERT INTO public.user_roles (user_id, role) VALUES ('${userId}', 'admin') ON CONFLICT (user_id, role) DO NOTHING;`);
      }

      return res.json({ success: true, message: "Database setup complete! Admin user created." });
    }

    return res.json({ success: true, message: "Database setup complete! All tables, categories, policies, and seed data created." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}
