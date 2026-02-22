import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/lib/product-types";

const mapProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  nameBn: p.name_bn,
  price: p.price,
  originalPrice: p.original_price ?? undefined,
  category: p.category,
  brand: p.brand,
  rating: Number(p.rating),
  reviews: p.reviews,
  image: p.image,
  description: p.description,
  descriptionBn: p.description_bn,
  specs: (p.specs as Record<string, string>) || {},
  inStock: p.in_stock,
  isNew: p.is_new,
  isBestseller: p.is_bestseller,
  discount: p.discount ?? undefined,
});

export const useSupabaseProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapProduct);
    },
    staleTime: 1000 * 60 * 5,
  });
};
