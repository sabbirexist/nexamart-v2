import ProductCard from "./ProductCard";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { Loader2 } from "lucide-react";

const BestsellersSection = () => {
  const { get } = useSiteSettings();
  const { data: products = [], isLoading } = useSupabaseProducts();
  const bestsellers = products.filter((p) => p.isBestseller);

  return (
    <section className="py-16 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {get("bestsellers_title", "Bestsellers 🔥")}
          </h2>
          <p className="text-muted-foreground font-bangla">{get("bestsellers_subtitle", "সবচেয়ে জনপ্রিয় পণ্য")}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {bestsellers.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BestsellersSection;
