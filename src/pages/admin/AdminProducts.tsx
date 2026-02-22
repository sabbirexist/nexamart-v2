import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/product-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, X, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";

interface ProductForm {
  id?: string;
  name: string;
  name_bn: string;
  price: number | "";
  original_price: number | null;
  category: string;
  brand: string;
  image: string;
  description: string;
  description_bn: string;
  in_stock: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  discount: number | null;
  rating: number;
  reviews: number;
  specs: Record<string, string>;
  tags: string[];
}

const DEFAULT_TAGS = ["New Arrivals", "Trending", "Top Selling", "Flash Sale"];

const emptyProduct: ProductForm = {
  name: "", name_bn: "", price: "", original_price: null, category: "phones",
  brand: "", image: "", description: "", description_bn: "",
  in_stock: true, is_new: false, is_bestseller: false, discount: null, rating: 4.0, reviews: 0,
  specs: {}, tags: [],
};

const calcDiscount = (price: number | "", originalPrice: number | null): number | null => {
  if (!price || !originalPrice || originalPrice <= 0 || Number(price) >= originalPrice) return null;
  return Math.round(((originalPrice - Number(price)) / originalPrice) * 100);
};

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [editing, setEditing] = useState<ProductForm | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [specKey, setSpecKey] = useState("");
  const [specVal, setSpecVal] = useState("");
  const [customTag, setCustomTag] = useState("");

  const { data: productList = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    
    const priceNum = Number(editing.price) || 0;
    const discount = calcDiscount(editing.price, editing.original_price);

    const payload = {
      name: editing.name, name_bn: editing.name_bn, price: priceNum,
      original_price: editing.original_price, category: editing.category,
      brand: editing.brand, image: editing.image, description: editing.description,
      description_bn: editing.description_bn, in_stock: editing.in_stock,
      is_new: editing.is_new, is_bestseller: editing.is_bestseller,
      discount, rating: editing.rating, reviews: editing.reviews,
      specs: editing.specs, tags: editing.tags,
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }

    if (error) {
      toast({ title: "Error saving product", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product saved!" });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  const addSpec = () => {
    if (!specKey.trim() || !editing) return;
    setEditing({ ...editing, specs: { ...editing.specs, [specKey.trim()]: specVal.trim() } });
    setSpecKey("");
    setSpecVal("");
  };

  const removeSpec = (key: string) => {
    if (!editing) return;
    const newSpecs = { ...editing.specs };
    delete newSpecs[key];
    setEditing({ ...editing, specs: newSpecs });
  };

  const toggleTag = (tag: string) => {
    if (!editing) return;
    const tags = editing.tags.includes(tag)
      ? editing.tags.filter((t) => t !== tag)
      : [...editing.tags, tag];
    setEditing({ ...editing, tags });
  };

  const addCustomTag = () => {
    if (!customTag.trim() || !editing) return;
    if (!editing.tags.includes(customTag.trim())) {
      setEditing({ ...editing, tags: [...editing.tags, customTag.trim()] });
    }
    setCustomTag("");
  };

  const autoDiscount = editing ? calcDiscount(editing.price, editing.original_price) : null;

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Manage Products</h2>
        <Button onClick={() => { setEditing({ ...emptyProduct }); setShowForm(true); }} className="gap-2 rounded-lg">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {showForm && editing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{editing.id ? "Edit Product" : "Add Product"}</h3>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditing(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-xs text-muted-foreground">Name</label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><label className="text-xs text-muted-foreground">Name (Bangla)</label><Input value={editing.name_bn} onChange={(e) => setEditing({ ...editing, name_bn: e.target.value })} /></div>
            <div>
              <label className="text-xs text-muted-foreground">Price (৳)</label>
              <Input type="number" placeholder="Enter price" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value === "" ? "" : Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Original Price</label>
              <Input type="number" placeholder="Optional" value={editing.original_price || ""} onChange={(e) => setEditing({ ...editing, original_price: Number(e.target.value) || null })} />
            </div>
            {autoDiscount !== null && (
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Auto Discount: </span>
                <span className="text-sm font-semibold text-green-600">-{autoDiscount}%</span>
              </div>
            )}
            <div><label className="text-xs text-muted-foreground">Brand</label><Input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></div>
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2"><label className="text-xs text-muted-foreground">Image URL</label><Input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></div>
            <div className="sm:col-span-2">
             <label className="text-xs text-muted-foreground">Description</label>
              <textarea value={editing.description} onChange={(e) => { setEditing({ ...editing, description: e.target.value }); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none overflow-hidden" style={{ height: "auto" }} ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.max(120, el.scrollHeight) + "px"; } }} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Description (Bangla)</label>
              <textarea value={editing.description_bn} onChange={(e) => { setEditing({ ...editing, description_bn: e.target.value }); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none overflow-hidden font-bangla" style={{ height: "auto" }} ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.max(120, el.scrollHeight) + "px"; } }} />
            </div>

            {/* Specifications */}
            <div className="sm:col-span-2 bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-semibold text-foreground">Specifications</h4>
                <div className="group relative">
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  <div className="hidden group-hover:block absolute left-0 top-5 bg-card border border-border rounded-lg p-3 text-xs text-muted-foreground w-64 z-10 shadow-lg">
                    <p className="font-medium text-foreground mb-1">How to add specs:</p>
                    <p>Type the spec name (e.g., "Display") and value (e.g., "6.7 inch AMOLED"), then click Add.</p>
                  </div>
                </div>
              </div>
              {Object.entries(editing.specs).length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {Object.entries(editing.specs).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 bg-background rounded-md px-3 py-1.5 text-sm">
                      <span className="font-medium text-foreground min-w-[100px]">{k}</span>
                      <span className="text-muted-foreground flex-1">{v}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSpec(k)}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Spec name" value={specKey} onChange={(e) => setSpecKey(e.target.value)} className="flex-1" />
                <Input placeholder="Value" value={specVal} onChange={(e) => setSpecVal(e.target.value)} className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addSpec} className="shrink-0">Add</Button>
              </div>
            </div>

            {/* Stock Status */}
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-2 block">Stock Status</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, in_stock: true })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${editing.in_stock ? "bg-green-600 text-white border-green-600" : "bg-background text-muted-foreground border-border hover:border-foreground"}`}
                >
                  In Stock
                </button>
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, in_stock: false })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!editing.in_stock ? "bg-destructive text-destructive-foreground border-destructive" : "bg-background text-muted-foreground border-border hover:border-foreground"}`}
                >
                  Out of Stock
                </button>
              </div>
            </div>

            {/* Product Tags */}
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-2 block">Product Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {DEFAULT_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${editing.tags.includes(tag) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-foreground"}`}
                  >
                    {tag}
                  </button>
                ))}
                {editing.tags.filter((t) => !DEFAULT_TAGS.includes(t)).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border bg-primary text-primary-foreground border-primary flex items-center gap-1"
                  >
                    {tag} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
              <div className="flex gap-2 max-w-xs">
                <Input
                  placeholder="Custom tag"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                  className="text-sm"
                />
                <Button type="button" variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={addCustomTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Legacy toggles */}
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={editing.is_new} onChange={(e) => setEditing({ ...editing, is_new: e.target.checked })} /> Mark as New</label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={editing.is_bestseller} onChange={(e) => setEditing({ ...editing, is_bestseller: e.target.checked })} /> Bestseller</label>
            </div>
            <div><label className="text-xs text-muted-foreground">Rating</label><Input type="number" step="0.1" min="0" max="5" value={editing.rating} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })} /></div>
            <div><label className="text-xs text-muted-foreground">Reviews Count</label><Input type="number" min="0" placeholder="e.g. 150" value={editing.reviews} onChange={(e) => setEditing({ ...editing, reviews: Number(e.target.value) || 0 })} /></div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-4 rounded-lg gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Product
          </Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-muted-foreground font-medium">Product</th>
              <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Category</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Price</th>
              <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Stock</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {productList.map((p) => {
              const cat = categories.find((c) => c.slug === p.category);
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-secondary" />
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{cat ? `${cat.icon} ${cat.name}` : p.category}</td>
                  <td className="p-3 font-medium text-primary">{formatPrice(p.price)}</td>
                  <td className="p-3 hidden md:table-cell">
                    <span className={`text-xs font-medium ${p.in_stock ? "text-green-600" : "text-destructive"}`}>
                      {p.in_stock ? "In Stock" : "Out"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        setEditing({
                          id: p.id, name: p.name, name_bn: p.name_bn, price: p.price,
                          original_price: p.original_price, category: p.category, brand: p.brand,
                          image: p.image, description: p.description, description_bn: p.description_bn,
                          in_stock: p.in_stock, is_new: p.is_new, is_bestseller: p.is_bestseller,
                          discount: p.discount, rating: Number(p.rating), reviews: p.reviews,
                          specs: (typeof p.specs === "object" && p.specs !== null ? p.specs : {}) as Record<string, string>,
                          tags: (Array.isArray((p as any).tags) ? (p as any).tags : []) as string[],
                        });
                        setShowForm(true);
                      }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;