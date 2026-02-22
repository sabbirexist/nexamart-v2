import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { Loader2 } from "lucide-react";

const Wishlist = () => {
  const { wishlist } = useCart();
  const { data: products = [], isLoading } = useSupabaseProducts();
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">Start adding products you love!</p>
          <Link to="/products">
            <Button className="rounded-xl">Browse Products</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">
          Wishlist <span className="text-muted-foreground">({wishlistProducts.length})</span>
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {wishlistProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </main>
  );
};

export default Wishlist;
