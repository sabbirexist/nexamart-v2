import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSettings } from "@/hooks/useSiteSettings";
import { Save, Loader2, Plus, Trash2, KeyRound, Eye, EyeOff } from "lucide-react";

const SETTING_KEYS = [
  { key: "site_name", label: "Site Name" },
  { key: "free_shipping_min", label: "Free Shipping Min (৳)" },
  { key: "dhaka_shipping", label: "Dhaka Shipping (৳)" },
  { key: "outside_shipping", label: "Outside Dhaka Shipping (৳)" },
];

interface PaymentMethod {
  id: string;
  name: string;
  number: string;
  instructions: string;
  color: string;
}

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "bkash", name: "bKash", number: "", instructions: "Send Money to the number above, then enter your bKash number and Transaction ID.", color: "#E2136E" },
  { id: "cod", name: "Cash on Delivery", number: "", instructions: "ডেলিভারির সময় ক্যাশ দিয়ে পেমেন্ট করুন। অতিরিক্ত কোনো চার্জ নেই।", color: "" },
];

const AdminSettings = () => {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("key, value").then(({ data }) => {
      const map: Record<string, string> = {};
      data?.forEach((r) => (map[r.key] = r.value));
      if (!map.site_name) map.site_name = "NexaMart";
      if (!map.free_shipping_min) map.free_shipping_min = "5000";
      if (!map.dhaka_shipping) map.dhaka_shipping = "60";
      if (!map.outside_shipping) map.outside_shipping = "150";

      try {
        const methods = map.payment_methods ? JSON.parse(map.payment_methods) : DEFAULT_PAYMENT_METHODS;
        setPaymentMethods(methods);
      } catch {
        setPaymentMethods(DEFAULT_PAYMENT_METHODS);
      }

      setValues(map);
      setLoading(false);
    });
  }, []);

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, {
      id: `pm_${Date.now()}`,
      name: "",
      number: "",
      instructions: "",
      color: "",
    }]);
  };

  const updateMethod = (index: number, field: keyof PaymentMethod, value: string) => {
    const updated = [...paymentMethods];
    updated[index] = { ...updated[index], [field]: value };
    setPaymentMethods(updated);
  };

  const removeMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);

    for (const item of SETTING_KEYS) {
      const val = values[item.key] || "";
      const { data } = await supabase.from("site_settings").update({ value: val }).eq("key", item.key).select();
      if (!data || data.length === 0) {
        await supabase.from("site_settings").insert({ key: item.key, value: val });
      }
    }

    const methodsJson = JSON.stringify(paymentMethods);
    const { data } = await supabase.from("site_settings").update({ value: methodsJson }).eq("key", "payment_methods").select();
    if (!data || data.length === 0) {
      await supabase.from("site_settings").insert({ key: "payment_methods", value: methodsJson });
    }

    invalidateSettings();
    toast({ title: "Settings saved!" });
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error changing password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password changed successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-foreground mb-6">Shop Settings</h2>

      {/* General Settings */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4 mb-6">
        <h3 className="font-semibold text-foreground text-sm">🏪 General</h3>
        {SETTING_KEYS.map((item) => (
          <div key={item.key}>
            <label className="text-sm text-muted-foreground mb-1 block">{item.label}</label>
            <Input
              value={values[item.key] || ""}
              onChange={(e) => setValues({ ...values, [item.key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">💳 Payment Methods</h3>
          <Button variant="outline" size="sm" onClick={addPaymentMethod} className="gap-1 text-xs">
            <Plus className="h-3 w-3" /> Add Method
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Methods with a "number" will ask customers for their sender number and transaction ID at checkout.</p>

        {paymentMethods.map((method, index) => (
          <div key={method.id} className="border border-border rounded-lg p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Method #{index + 1}</span>
              {paymentMethods.length > 1 && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMethod(index)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                <Input value={method.name} onChange={(e) => updateMethod(index, "name", e.target.value)} placeholder="e.g. bKash, Nagad, COD" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Brand Color (hex)</label>
                <div className="flex gap-2">
                  <Input value={method.color} onChange={(e) => updateMethod(index, "color", e.target.value)} placeholder="#E2136E" />
                  {method.color && (
                    <div className="w-10 h-10 rounded-md border border-border shrink-0" style={{ background: method.color }} />
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Account/Merchant Number (leave empty for COD)</label>
              <Input value={method.number} onChange={(e) => updateMethod(index, "number", e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Instructions for Customer</label>
              <textarea
                value={method.instructions}
                onChange={(e) => updateMethod(index, "instructions", e.target.value)}
                placeholder="Instructions shown to customer at checkout"
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="rounded-lg gap-2 w-full mb-8">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Settings
      </Button>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" /> Change Admin Password
        </h3>
        <p className="text-xs text-muted-foreground">Update your admin login password. Minimum 8 characters.</p>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">New Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="pr-10"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Confirm Password</label>
          <Input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive mt-1">Passwords do not match</p>
          )}
        </div>
        <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline" className="w-full gap-2">
          {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Update Password
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
