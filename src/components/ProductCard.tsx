import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Star, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Product, formatPrice } from "@/lib/product-types";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart, toggleWishlist, isInWishlist, items } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const isInCart = items.some((i) => i.product.id === product.id);

  const handleAddToCart = () => {
    if (isInCart) {
      navigate("/cart");
      return;
    }
    setAdding(true);
    addToCart(product);
    setTimeout(() => setAdding(false), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-surface">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.discount && (
            <span className="badge-sale text-xs font-semibold px-2 py-0.5 rounded-md">
              -{product.discount}%
            </span>
          )}
          {product.isNew && (
            <span className="badge-new text-xs font-semibold px-2 py-0.5 rounded-md">
              New
            </span>
          )}
          {!product.inStock && (
            <span className="bg-gray-800/80 text-white text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">
              Out of Stock
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart
            className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
          />
        </button>
      </Link>

      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors mb-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3.5 w-3.5 text-rating fill-current" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>

        <div>
          <span className="text-base font-bold text-price">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-price-old line-through ml-2">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        <Button
          className="w-full mt-2 rounded-lg gap-2 h-9 text-xs"
          variant={isInCart && !adding ? "outline" : "default"}
          onClick={handleAddToCart}
          disabled={adding || !product.inStock}
        >
          {adding ? (
            <>
              <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
              <span className="font-bangla">যোগ হচ্ছে...</span>
            </>
          ) : isInCart ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span className="font-bangla">কার্ট দেখুন</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="font-bangla">কার্টে যোগ করুন</span>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
