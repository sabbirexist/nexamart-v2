import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/product-types";
import { Button } from "@/components/ui/button";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();

  const shippingCost = subtotal > 0 ? (subtotal > 5000 ? 0 : 100) : 0;
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6 font-bangla">আপনার কার্টে কোনো পণ্য নেই</p>
          <Link to="/products">
            <Button className="rounded-xl">Continue Shopping</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-8">
          Shopping Cart <span className="text-muted-foreground font-bangla text-lg">({items.length} items)</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-4 bg-card border border-border rounded-xl p-4"
              >
                <Link to={`/product/${item.product.id}`} className="w-20 h-20 rounded-lg overflow-hidden bg-surface shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.id}`}>
                    <h3 className="text-sm font-medium text-foreground line-clamp-1 hover:text-primary transition-colors">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-2">{item.product.brand}</p>
                  <p className="text-sm font-bold text-price">{formatPrice(item.product.price)}</p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2 border border-border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-surface rounded-l-lg transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-surface rounded-r-lg transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-6 h-fit sticky top-24">
            <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-foreground">
                  {shippingCost === 0 ? (
                    <span className="text-success">Free</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>
              {shippingCost === 0 && subtotal > 0 && (
                <p className="text-xs text-success font-bangla">৳৫,০০০+ অর্ডারে ফ্রি ডেলিভারি!</p>
              )}
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-lg text-price">{formatPrice(total)}</span>
              </div>
            </div>

            <Link to="/checkout">
              <Button className="w-full rounded-xl font-semibold gap-2" size="lg">
                <span className="font-bangla">অর্ডার করুন</span> – Checkout
              </Button>
            </Link>
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              bKash, SSLCommerz & Cash on Delivery available
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Cart;
