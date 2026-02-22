import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, ShoppingBag, DollarSign, TrendingUp, Loader2, Users, BarChart3, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/product-types";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["hsl(0, 84%, 55%)", "hsl(0, 84%, 70%)", "hsl(0, 60%, 45%)", "hsl(0, 40%, 60%)", "hsl(0, 84%, 80%)", "hsl(200, 60%, 50%)"];

const AdminDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDeleteOldOrders = async (period: string) => {
    const labels: Record<string, string> = { "1m": "1 month", "6m": "6 months", "1y": "1 year" };
    if (!confirm(`Delete all orders older than ${labels[period]}? This cannot be undone.`)) return;
    setDeleting(period);
    const now = new Date();
    if (period === "1m") now.setMonth(now.getMonth() - 1);
    else if (period === "6m") now.setMonth(now.getMonth() - 6);
    else now.setFullYear(now.getFullYear() - 1);
    const { error, count } = await supabase.from("orders").delete().lt("created_at", now.toISOString());
    if (error) {
      toast({ title: "Error deleting orders", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Deleted orders older than ${labels[period]}` });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    }
    setDeleting(null);
  };
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-count"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, category, price");
      return data || [];
    },
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-dash"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data || [];
    },
  });

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;

  const stats = [
    { label: "Total Products", value: products.length, icon: Package, color: "text-primary" },
    { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-green-600" },
    { label: "Revenue", value: formatPrice(totalRevenue), icon: DollarSign, color: "text-amber-600" },
    { label: "Pending", value: pendingOrders, icon: TrendingUp, color: "text-destructive" },
  ];

  // Revenue by day (last 7 days)
  const revenueByDay = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString("en-US", { weekday: "short" })] = 0;
    }
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      if (key in days) days[key] += o.total || 0;
    });
    return Object.entries(days).map(([name, revenue]) => ({ name, revenue }));
  }, [orders]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Products by category
  const productsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p: any) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => {
      const cat = categories.find((c: any) => c.slug === name);
      return { name: cat?.name || name, value };
    });
  }, [products, categories]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Delete orders older than:</span>
          {["1m", "6m", "1y"].map((p) => (
            <Button key={p} variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDeleteOldOrders(p)} disabled={!!deleting}>
              {deleting === p ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              {p === "1m" ? "1 Month" : p === "6m" ? "6 Months" : "1 Year"}
            </Button>
          ))}
        </div>
      </div>

      {/* Pending Alert */}
      {pendingOrders > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">{pendingOrders} Pending {pendingOrders === 1 ? "Order" : "Orders"}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Awaiting confirmation</p>
            </div>
          </div>
          <a href="/admin/orders" className="text-xs font-medium text-amber-700 dark:text-amber-300 underline hover:no-underline">View Orders →</a>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Revenue (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Order Status</h3>
          <div className="h-64 flex items-center justify-center">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name} (${value})`}>
                    {ordersByStatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No orders yet</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Products by Category */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-xl p-5 mb-8">
        <h3 className="font-semibold text-foreground mb-4">Products by Category</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productsByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={120} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Orders */}
      <h3 className="font-semibold text-foreground mb-4">Recent Orders</h3>
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-sm">No orders yet.</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Order #</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Customer</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Total</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium text-foreground">{o.order_number}</td>
                  <td className="p-3 text-muted-foreground">{o.customer_name}</td>
                  <td className="p-3 font-medium text-primary">{formatPrice(o.total || 0)}</td>
                  <td className="p-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${o.status === "pending" ? "bg-amber-100 text-amber-700" : o.status === "delivered" ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
