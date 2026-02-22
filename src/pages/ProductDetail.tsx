import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Heart, Truck, Shield, ArrowLeft, Check, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/product-types";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useSupabaseProducts();
  const product = products.find((p) => p.id === id);
  const { addToCart, toggleWishlist, isInWishlist, items } = useCart();
  const [adding, setAdding] = useState(false);
  const isInCart = product ? items.some((i) => i.product.id === product.id) : false;

  const handleAddToCart = () => {
    if (!product) return;
    if (isInCart) { navigate("/cart"); return; }
    setAdding(true);
    addToCart(product);
    setTimeout(() => setAdding(false), 1000);
  };

  if (isLoading) {
    return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Product not found</p>
          <Link to="/products"><Button>Back to Products</Button></Link>
        </div>
      </div>
    );
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-square rounded-2xl overflow-hidden bg-surface border border-border">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <p className="text-sm text-primary font-medium mb-1">{product.brand}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{product.name}</h1>
            <p className="text-sm text-muted-foreground font-bangla mb-4">{product.nameBn}</p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-rating fill-current" />
                <span className="font-semibold text-foreground">{product.rating}</span>
              </div>
              <span className="text-muted-foreground text-sm">({product.reviews} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-price">{formatPrice(product.price)}</span>
              {product.originalPrice && <span className="text-lg text-price-old line-through">{formatPrice(product.originalPrice)}</span>}
              {product.discount && <span className="badge-sale text-xs font-semibold px-2 py-1 rounded-md">-{product.discount}%</span>}
            </div>

            <p className="text-muted-foreground mb-2">{product.description}</p>
            <p className="text-muted-foreground font-bangla text-sm mb-6">{product.descriptionBn}</p>

            <div className="flex items-center gap-2 mb-6">
              {product.inStock ? (
                <><Check className="h-4 w-4 text-success" /><span className="text-sm font-medium text-success">In Stock</span></>
              ) : (
                <span className="text-sm font-medium text-destructive">Out of Stock</span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              <Button
                size="lg"
                className="flex-1 gap-2 rounded-xl"
                variant={isInCart && !adding ? "outline" : "default"}
                onClick={handleAddToCart}
                disabled={adding || !product.inStock}
              >
                {adding ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    <span className="font-bangla">যোগ হচ্ছে...</span>
                  </>
                ) : isInCart ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="font-bangla">কার্ট দেখুন</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    <span className="font-bangla">কার্টে যোগ করুন</span>
                  </>
                )}
              </Button>
              <Button variant="outline" size="lg" className="rounded-xl" onClick={() => toggleWishlist(product.id)}>
                <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-destructive text-destructive" : ""}`} />
              </Button>
            </div>

            <div className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center gap-3 text-sm"><Truck className="h-4 w-4 text-primary" /><span className="text-muted-foreground">ঢাকায় ফ্রি ডেলিভারি • বাইরে ৳50-150</span></div>
              <div className="flex items-center gap-3 text-sm"><Shield className="h-4 w-4 text-primary" /><span className="text-muted-foreground">১০০% অরিজিনাল পণ্যের গ্যারান্টি</span></div>
            </div>

            {Object.keys(product.specs).length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-foreground mb-3">Specifications</h3>
                <div className="border border-border rounded-xl overflow-hidden">
                  {Object.entries(product.specs).map(([key, value], i) => (
                    <div key={key} className={`flex justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-surface" : "bg-card"}`}>
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-foreground mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default ProductDetail;
