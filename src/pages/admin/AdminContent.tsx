import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSettings } from "@/hooks/useSiteSettings";
import { Save, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CONTENT_GROUPS = [
  {
    title: "🏠 Navbar & Branding",
    keys: [
      { key: "site_name", label: "Site Name" },
      { key: "site_tagline", label: "Tagline / Short Description" },
      { key: "nav_link_1", label: "Nav Link 1 Label" },
      { key: "nav_link_1_url", label: "Nav Link 1 URL" },
      { key: "nav_link_2", label: "Nav Link 2 Label" },
      { key: "nav_link_2_url", label: "Nav Link 2 URL" },
      { key: "nav_link_3", label: "Nav Link 3 Label" },
      { key: "nav_link_3_url", label: "Nav Link 3 URL" },
      { key: "nav_link_4", label: "Nav Link 4 Label" },
      { key: "nav_link_4_url", label: "Nav Link 4 URL" },
      { key: "nav_link_5", label: "Nav Link 5 Label" },
      { key: "nav_link_5_url", label: "Nav Link 5 URL" },
    ],
  },
  {
    title: "🎯 Hero Section",
    keys: [
      { key: "hero_badge", label: "Badge Text" },
      { key: "hero_title_1", label: "Title Line 1" },
      { key: "hero_title_2", label: "Title Line 2 (colored)" },
      { key: "hero_description", label: "Description" },
      { key: "hero_btn_primary", label: "Primary Button Text" },
      { key: "hero_btn_primary_url", label: "Primary Button URL" },
      { key: "hero_btn_secondary", label: "Secondary Button Text" },
      { key: "hero_btn_secondary_url", label: "Secondary Button URL" },
    ],
  },
  {
    title: "✅ Trust Bar",
    keys: [
      { key: "trust_1_label", label: "Trust 1 Label" },
      { key: "trust_1_sub", label: "Trust 1 Subtitle" },
      { key: "trust_2_label", label: "Trust 2 Label" },
      { key: "trust_2_sub", label: "Trust 2 Subtitle" },
      { key: "trust_3_label", label: "Trust 3 Label" },
      { key: "trust_3_sub", label: "Trust 3 Subtitle" },
    ],
  },
  {
    title: "📂 Categories Section",
    keys: [
      { key: "categories_title", label: "Title" },
      { key: "categories_subtitle", label: "Subtitle" },
    ],
  },
  {
    title: "🔥 Bestsellers Section",
    keys: [
      { key: "bestsellers_title", label: "Title" },
      { key: "bestsellers_subtitle", label: "Subtitle" },
    ],
  },
  {
    title: "⚡ Promo Banner",
    keys: [
      { key: "promo_label", label: "Label" },
      { key: "promo_title", label: "Title" },
      { key: "promo_description", label: "Description" },
      { key: "promo_btn", label: "Button Text" },
      { key: "promo_btn_url", label: "Button URL" },
    ],
  },
  {
    title: "🔗 Footer - Quick Links",
    keys: [
      { key: "footer_description", label: "Footer Description" },
      { key: "footer_quicklinks_title", label: "Quick Links Title" },
      { key: "footer_ql_1", label: "Quick Link 1 Label" },
      { key: "footer_ql_1_url", label: "Quick Link 1 URL" },
      { key: "footer_ql_2", label: "Quick Link 2 Label" },
      { key: "footer_ql_2_url", label: "Quick Link 2 URL" },
      { key: "footer_ql_3", label: "Quick Link 3 Label" },
      { key: "footer_ql_3_url", label: "Quick Link 3 URL" },
      { key: "footer_ql_4", label: "Quick Link 4 Label" },
      { key: "footer_ql_4_url", label: "Quick Link 4 URL" },
    ],
  },
  {
    title: "🛟 Footer - Support Links",
    keys: [
      { key: "footer_support_title", label: "Support Title" },
      { key: "footer_sp_1", label: "Support Link 1 Label" },
      { key: "footer_sp_1_url", label: "Support Link 1 URL" },
      { key: "footer_sp_2", label: "Support Link 2 Label" },
      { key: "footer_sp_2_url", label: "Support Link 2 URL" },
      { key: "footer_sp_3", label: "Support Link 3 Label" },
      { key: "footer_sp_3_url", label: "Support Link 3 URL" },
      { key: "footer_sp_4", label: "Support Link 4 Label" },
      { key: "footer_sp_4_url", label: "Support Link 4 URL" },
    ],
  },
  {
    title: "📞 Contact Info",
    keys: [
      { key: "contact_title", label: "Contact Section Title" },
      { key: "contact_phone", label: "Phone Number" },
      { key: "contact_email", label: "Email Address" },
      { key: "contact_address", label: "Address" },
      { key: "copyright_text", label: "Copyright Text" },
    ],
  },
  {
    title: "🛒 Product Page Texts",
    keys: [
      { key: "product_add_to_cart", label: "Add to Cart Button" },
      { key: "product_buy_now", label: "Buy Now Button" },
      { key: "product_in_stock", label: "In Stock Text" },
      { key: "product_out_of_stock", label: "Out of Stock Text" },
      { key: "product_specs_title", label: "Specifications Title" },
      { key: "product_related_title", label: "Related Products Title" },
    ],
  },
  {
    title: "📦 Order & Checkout Texts",
    keys: [
      { key: "checkout_title", label: "Checkout Page Title" },
      { key: "order_success_title", label: "Order Success Title" },
      { key: "order_success_msg", label: "Order Success Message" },
      { key: "track_order_title", label: "Track Order Page Title" },
      { key: "track_order_placeholder", label: "Track Order Placeholder" },
    ],
  },
];

const AdminContent = () => {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.from("site_settings").select("key, value").then(({ data, error }) => {
      if (error) console.error("Failed to load settings:", error.message);
      const map: Record<string, string> = {};
      data?.forEach((r) => (map[r.key] = r.value));
      setValues(map);
      setLoading(false);
    });
  }, []);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allKeys = CONTENT_GROUPS.flatMap((g) => g.keys.map((k) => k.key));
      for (const key of allKeys) {
        const val = values[key] || "";
        const { data } = await supabase.from("site_settings").update({ value: val }).eq("key", key).select();
        if (!data || data.length === 0) {
          await supabase.from("site_settings").insert({ key, value: val });
        }
      }
      invalidateSettings();
      toast({ title: "Content saved successfully!" });
    } catch (err) {
      toast({ title: "Error saving", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Edit Site Content</h2>
          <p className="text-sm text-muted-foreground mt-1">Customize every text element on your website</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All
        </Button>
      </div>

      <div className="space-y-3">
        {CONTENT_GROUPS.map((group) => {
          const isOpen = openSections[group.title] !== false; // default open
          return (
            <div key={group.title} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection(group.title)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
              >
                <h3 className="font-semibold text-foreground text-sm">{group.title}</h3>
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      {group.keys.map((item) => (
                        <div key={item.key}>
                          <label className="text-xs text-muted-foreground mb-1 block">{item.label} <span className="text-muted-foreground/50">({item.key})</span></label>
                          <Input
                            value={values[item.key] || ""}
                            onChange={(e) => setValues({ ...values, [item.key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminContent;
