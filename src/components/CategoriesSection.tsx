import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { useCategories } from "@/hooks/useCategories";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";

const CategoriesSection = () => {
  const { get } = useSiteSettings();
  const { data: products = [], isLoading: productsLoading } = useSupabaseProducts();
  const { data: dbCategories = [], isLoading: catsLoading } = useCategories();

  const categories = useMemo(() => {
    const catCounts: Record<string, number> = {};
    products.forEach((p) => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
    return dbCategories.map((c) => ({
      ...c,
      productCount: catCounts[c.slug] || 0,
    }));
  }, [products, dbCategories]);

  const isLoading = productsLoading || catsLoading;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {get("categories_title", "Shop by Category")}
          </h2>
          <p className="text-muted-foreground font-bangla">{get("categories_subtitle", "আপনার পছন্দের ক্যাটেগরি বেছে নিন")}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                <Link to={`/products?category=${cat.slug}`} className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl hover:shadow-md hover:border-primary/30 transition-all duration-300 group">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground font-bangla">{cat.name_bn}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{cat.productCount} products</span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
