import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Truck, Check, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/product-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface PaymentMethodConfig {
  id: string;
  name: string;
  number: string;
  instructions: string;
  color: string;
}

const DEFAULT_METHODS: PaymentMethodConfig[] = [
  { id: "bkash", name: "bKash", number: "", instructions: "Send Money to the number above, then enter your bKash number and Transaction ID.", color: "#E2136E" },
  { id: "cod", name: "Cash on Delivery", number: "", instructions: "ডেলিভারির সময় ক্যাশ দিয়ে পেমেন্ট করুন। অতিরিক্ত কোনো চার্জ নেই।", color: "" },
];

interface OrderForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  senderNumber: string;
  transactionId: string;
}

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { get } = useSiteSettings();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [form, setForm] = useState<OrderForm>({
    name: "", phone: "", address: "", city: "Dhaka", senderNumber: "", transactionId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Parse payment methods from settings
  let paymentMethods: PaymentMethodConfig[] = DEFAULT_METHODS;
  try {
    const raw = get("payment_methods", "");
    if (raw) paymentMethods = JSON.parse(raw);
  } catch { /* use defaults */ }

  // Set default selected method
  if (!selectedMethod && paymentMethods.length > 0) {
    // Will be set on first render via effect-like pattern
  }
  const activeMethod = paymentMethods.find((m) => m.id === selectedMethod) || paymentMethods[0];
  const activeMethodId = activeMethod?.id || "";
  const needsPaymentDetails = activeMethod?.number; // has a merchant number = needs sender details

  const freeShippingMin = Number(get("free_shipping_min", "5000"));
  const dhakaShipping = Number(get("dhaka_shipping", "60"));
  const outsideShipping = Number(get("outside_shipping", "150"));
  const shippingCost = subtotal > freeShippingMin ? 0 : form.city === "Dhaka" ? dhakaShipping : outsideShipping;
  const total = subtotal + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (needsPaymentDetails && (!form.senderNumber || !form.transactionId)) {
      toast({ title: `Please fill ${activeMethod.name} payment details`, variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const orderNumber = `ORD-${Date.now()}`;
    const orderItems = items.map((i) => ({
      productId: i.product.id, name: i.product.name, qty: i.quantity, price: i.product.price,
    }));

    const { data: session } = await supabase.auth.getSession();

    const { error } = await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_name: form.name,
      customer_phone: form.phone,
      customer_address: form.address,
      customer_city: form.city,
      payment_method: activeMethod.name,
      bkash_number: needsPaymentDetails ? form.senderNumber : null,
      transaction_id: needsPaymentDetails ? form.transactionId : null,
      items: orderItems as any,
      subtotal,
      shipping: shippingCost,
      total,
      user_id: session?.session?.user?.id || null,
    });

    if (error) {
      toast({ title: "Error placing order", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    clearCart();
    setSubmitting(false);
    navigate("/order-success", { state: { orderId: orderNumber } });
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground mb-2">No items to checkout</p>
          <Link to="/products"><Button className="rounded-xl">Continue Shopping</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-8">{get("checkout_title", "Checkout")}</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3 space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Shipping Information</h2>
                <div className="space-y-4">
                  <div><label className="text-sm text-muted-foreground mb-1 block">Full Name *</label><Input name="name" value={form.name} onChange={handleChange} placeholder="আপনার নাম" required /></div>
                  <div><label className="text-sm text-muted-foreground mb-1 block">Phone Number *</label><Input name="phone" value={form.phone} onChange={handleChange} placeholder="+880 1XXX-XXXXXX" required /></div>
                  <div><label className="text-sm text-muted-foreground mb-1 block">Delivery Address *</label><Input name="address" value={form.address} onChange={handleChange} placeholder="Full address" required /></div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">City</label>
                    <select name="city" value={form.city} onChange={handleChange} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Khulna">Khulna</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Payment Method</h2>
                <div className={`grid gap-3 mb-4 ${paymentMethods.length <= 3 ? `grid-cols-${paymentMethods.length}` : "grid-cols-2 sm:grid-cols-3"}`}>
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${activeMethodId === method.id ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <span className="text-lg font-bold" style={method.color ? { color: method.color } : undefined}>
                        {!method.number && "💵 "}{method.name}
                      </span>
                      {method.number && <p className="text-xs text-muted-foreground mt-1">Send Money</p>}
                    </button>
                  ))}
                </div>

                {activeMethod && (
                  <div className="border-t border-border pt-4">
                    {needsPaymentDetails ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Send <strong className="text-foreground">{formatPrice(total)}</strong> to{" "}
                          <strong style={activeMethod.color ? { color: activeMethod.color } : undefined}>{activeMethod.number}</strong>{" "}
                          via {activeMethod.name} Send Money, then fill below:
                        </p>
                        {activeMethod.instructions && (
                          <p className="text-xs text-muted-foreground">{activeMethod.instructions}</p>
                        )}
                        <div><label className="text-sm text-muted-foreground mb-1 block">Your {activeMethod.name} Number *</label><Input name="senderNumber" value={form.senderNumber} onChange={handleChange} placeholder="01XXXXXXXXX" /></div>
                        <div><label className="text-sm text-muted-foreground mb-1 block">Transaction ID *</label><Input name="transactionId" value={form.transactionId} onChange={handleChange} placeholder="e.g. ABC1234XYZ" /></div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground font-bangla">{activeMethod.instructions}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground line-clamp-1 flex-1">{item.product.name} × {item.quantity}</span>
                      <span className="font-medium text-foreground ml-2">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 text-sm border-t border-border pt-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">{shippingCost === 0 ? <span className="text-success">Free</span> : formatPrice(shippingCost)}</span></div>
                  <div className="flex justify-between border-t border-border pt-2"><span className="font-semibold text-foreground">Total</span><span className="font-bold text-lg text-price">{formatPrice(total)}</span></div>
                </div>
                <Button type="submit" className="w-full mt-4 rounded-xl gap-2" size="lg" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><Check className="h-4 w-4" /> <span className="font-bangla">অর্ডার নিশ্চিত করুন</span></>}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Checkout;
