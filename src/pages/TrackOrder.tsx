import { useState } from "react";
import { PackageSearch, Loader2, Clock, CheckCircle, Truck, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/product-types";

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Pending", icon: <Clock className="h-5 w-5" />, color: "text-warning" },
  processing: { label: "Processing", icon: <Package className="h-5 w-5" />, color: "text-primary" },
  shipped: { label: "Shipped", icon: <Truck className="h-5 w-5" />, color: "text-primary" },
  delivered: { label: "Delivered", icon: <CheckCircle className="h-5 w-5" />, color: "text-success" },
  cancelled: { label: "Cancelled", icon: <Clock className="h-5 w-5" />, color: "text-destructive" },
};

const TrackOrder = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setOrder(null);
    setNotFound(false);

    const q = query.trim();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .or(`order_number.eq.${q},customer_phone.eq.${q}`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setOrder(data[0]);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const status = order ? STATUS_MAP[order.status] || STATUS_MAP.pending : null;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center mb-8">
          <PackageSearch className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Track Your Order</h1>
          <p className="text-muted-foreground font-bangla">অর্ডার ট্র্যাক করতে আপনার অর্ডার আইডি বা মোবাইল নম্বর দিন</p>
        </div>

        <form onSubmit={handleTrack} className="max-w-md mx-auto flex gap-2 mb-10">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order ID or Mobile Number"
            className="rounded-xl"
          />
          <Button type="submit" className="rounded-xl gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
            Track
          </Button>
        </form>

        {notFound && (
          <div className="max-w-md mx-auto text-center py-8">
            <p className="text-muted-foreground font-bangla">কোনো অর্ডার পাওয়া যায়নি। আবার চেষ্টা করুন।</p>
          </div>
        )}

        {order && status && (
          <div className="max-w-lg mx-auto bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={status.color}>{status.icon}</div>
              <div>
                <p className="font-semibold text-foreground">{status.label}</p>
                <p className="text-xs text-muted-foreground">Order #{order.order_number}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="text-foreground font-medium">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="text-foreground font-medium">{order.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="text-foreground font-medium capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-foreground font-bold">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default TrackOrder;
