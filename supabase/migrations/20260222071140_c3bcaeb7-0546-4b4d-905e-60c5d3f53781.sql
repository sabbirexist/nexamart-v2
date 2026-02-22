
-- Create pages table for policy/support pages
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_bn text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pages" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed policy pages
INSERT INTO public.pages (slug, title, title_bn, content) VALUES
('shipping-policy', 'Shipping Policy', 'শিপিং পলিসি', '## Shipping Policy

**Delivery Areas:** We deliver across all districts of Bangladesh.

**Delivery Time:**
- Dhaka City: 1-2 business days
- Outside Dhaka: 3-5 business days

**Shipping Charges:**
- Dhaka City: ৳60
- Outside Dhaka: ৳150
- Free shipping on orders above ৳5,000

**Tracking:** You will receive a tracking number via SMS once your order is shipped.

**Note:** Delivery times may vary during holidays and promotional periods.'),

('return-refund', 'Return & Refund', 'রিটার্ন ও রিফান্ড', '## Return & Refund Policy

**Return Window:** 7 days from delivery date.

**Eligible for Return:**
- Defective or damaged products
- Wrong product delivered
- Product not matching description

**Not Eligible:**
- Products with broken seals
- Physical damage caused by user
- Products used for more than 24 hours

**Refund Process:**
1. Contact us within 7 days
2. We will arrange pickup
3. Refund processed within 3-5 business days after receiving the product
4. Refund via bKash or original payment method'),

('privacy-policy', 'Privacy Policy', 'প্রাইভেসি পলিসি', '## Privacy Policy

**Information We Collect:**
- Name, phone number, email address
- Delivery address
- Payment information (bKash number, transaction ID)
- Device and browser information

**How We Use Your Information:**
- Process and deliver orders
- Send order updates via SMS
- Improve our services
- Customer support

**Data Protection:**
- We use industry-standard encryption
- Payment details are not stored permanently
- We never share your data with third parties for marketing

**Contact:** For privacy concerns, email us at support@gadgetbd.com'),

('terms-of-service', 'Terms of Service', 'সেবার শর্তাবলী', '## Terms of Service

**General:**
By using GadgetBD, you agree to these terms.

**Products:**
- All products are 100% original
- Prices are in BDT (৳) and may change without notice
- Product images are for illustration purposes

**Orders:**
- Orders are confirmed after payment verification
- We reserve the right to cancel orders due to stock issues
- COD orders require phone verification

**Warranty:**
- Official brand warranty applies where available
- GadgetBD provides 7-day replacement warranty on all products

**Limitation of Liability:**
GadgetBD is not liable for damages beyond the product purchase price.

**Contact:** support@gadgetbd.com | +880 1700-000000');

-- Seed all editable site content into site_settings
INSERT INTO public.site_settings (key, value) VALUES
('hero_badge', '🇧🇩 বাংলাদেশে #১ গ্যাজেট শপ'),
('hero_title_1', 'Premium Gadgets,'),
('hero_title_2', 'Best Prices'),
('hero_description', 'অরিজিনাল ফোন, ইয়ারবাড, স্মার্টওয়াচ এবং আরও অনেক কিছু। সারাদেশে দ্রুত ডেলিভারি।'),
('hero_btn_primary', 'কিনুন – Shop Now'),
('hero_btn_primary_url', '/products'),
('hero_btn_secondary', 'Browse Phones'),
('hero_btn_secondary_url', '/products?category=phones'),
('trust_1_label', 'ঢাকায় ফ্রি ডেলিভারি'),
('trust_1_sub', 'Free delivery in Dhaka'),
('trust_2_label', '১০০% অরিজিনাল'),
('trust_2_sub', 'Genuine products guaranteed'),
('trust_3_label', '২৪/৭ সাপোর্ট'),
('trust_3_sub', 'Always here to help'),
('categories_title', 'Shop by Category'),
('categories_subtitle', 'আপনার পছন্দের ক্যাটেগরি বেছে নিন'),
('bestsellers_title', 'Bestsellers 🔥'),
('bestsellers_subtitle', 'সবচেয়ে জনপ্রিয় পণ্য'),
('promo_label', 'Limited Time Offer'),
('promo_title', 'Up to 30% Off on Audio'),
('promo_description', 'সেরা ইয়ারবাড এবং হেডফোনে বিশাল ছাড়! সীমিত সময়ের জন্য।'),
('promo_btn', 'Shop Audio Deals'),
('promo_btn_url', '/products?category=earbuds'),
('footer_description', 'বাংলাদেশের সবচেয়ে বিশ্বস্ত গ্যাজেট শপ। অরিজিনাল পণ্য, দ্রুত ডেলিভারি।'),
('contact_phone', '+880 1700-000000'),
('contact_email', 'support@gadgetbd.com'),
('contact_address', 'Gulshan, Dhaka 1212'),
('copyright_text', '© 2026 GadgetBD. All rights reserved.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
