import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/product-types";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ChevronDown, ChevronUp, Search, Filter, Phone, MapPin, CreditCard, Hash, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const AdminOrders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Status updated" });
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting order", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Order deleted" });
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.order_number?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.toLowerCase().includes(q) ||
      o.transaction_id?.toLowerCase().includes(q) ||
      o.bkash_number?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  const counts: Record<string, number> = { all: orders.length };
  orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Manage Orders</h2>
        <span className="text-sm text-muted-foreground">{filtered.length} orders</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, name, phone, TxnID..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {counts[s] !== undefined && <span className="ml-1 opacity-70">({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingBagIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isExpanded = expandedId === o.id;
            const hasMobilePayment = o.bkash_number || o.transaction_id;

            return (
              <div key={o.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
                {/* Order Header - Always visible */}
                <div className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono font-semibold text-foreground text-sm">{o.order_number}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || "bg-secondary text-muted-foreground"}`}>
                        {o.status}
                      </span>
                      {hasMobilePayment && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                          📱 {o.payment_method}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground">{o.customer_name}</span>
                      <span>{o.customer_phone}</span>
                      <span>{new Date(o.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-primary text-sm">{formatPrice(o.total || 0)}</span>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteOrder(o.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* bKash/Mobile Payment Alert - Always visible if present */}
                {hasMobilePayment && (
                  <div className="mx-4 mb-3 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-pink-600" />
                      <p className="text-xs font-semibold text-pink-700 dark:text-pink-400 uppercase tracking-wide">Payment Details — {o.payment_method}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {o.bkash_number && (
                        <div className="flex items-center gap-2 bg-white dark:bg-pink-950/30 rounded-md px-3 py-2">
                          <Phone className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Sender Number</p>
                            <p className="font-mono font-bold text-foreground">{o.bkash_number}</p>
                          </div>
                        </div>
                      )}
                      {o.transaction_id && (
                        <div className="flex items-center gap-2 bg-white dark:bg-pink-950/30 rounded-md px-3 py-2">
                          <Hash className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Transaction ID</p>
                            <p className="font-mono font-bold text-foreground">{o.transaction_id}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border p-4 bg-secondary/20">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> Shipping Address
                        </p>
                        <div className="bg-card border border-border rounded-lg p-3 text-sm space-y-1">
                          <p className="font-medium text-foreground">{o.customer_name}</p>
                          <p className="text-muted-foreground">{o.customer_phone}</p>
                          <p className="text-muted-foreground">{o.customer_address}</p>
                          <p className="text-muted-foreground">{o.customer_city}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5" /> Payment Summary
                        </p>
                        <div className="bg-card border border-border rounded-lg p-3 text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Method</span>
                            <span className="font-medium text-foreground">{o.payment_method}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">{formatPrice(o.subtotal || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span className="text-foreground">{o.shipping === 0 ? "Free" : formatPrice(o.shipping || 0)}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-border pt-1 mt-1">
                            <span className="text-foreground">Total</span>
                            <span className="text-primary">{formatPrice(o.total || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Order Items</p>
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                      {(o.items as any[])?.map((item: any, i: number) => (
                        <div key={i} className={`flex justify-between items-center px-3 py-2.5 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                          <div>
                            <span className="text-foreground font-medium">{item.name}</span>
                            <span className="text-muted-foreground ml-2">× {item.qty}</span>
                          </div>
                          <span className="font-medium text-foreground">{formatPrice(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Simple icon component
const ShoppingBagIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

export default AdminOrders;
