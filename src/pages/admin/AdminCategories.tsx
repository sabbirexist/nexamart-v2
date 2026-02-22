import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, X, Loader2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CategoryForm {
  id?: string;
  slug: string;
  name: string;
  name_bn: string;
  icon: string;
  sort_order: number;
}

const emptyCategory: CategoryForm = { slug: "", name: "", name_bn: "", icon: "📦", sort_order: 0 };

const EMOJI_OPTIONS = ["📱", "🎧", "⌚", "🔌", "🛡️", "🔋", "💻", "🖥️", "🎮", "📷", "🖨️", "⌨️", "🖱️", "🔊", "📺", "🎵", "🏠", "🚗", "👕", "👟", "📦"];

const AdminCategories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CategoryForm | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSave = async () => {
    if (!editing || !editing.slug || !editing.name) {
      toast({ title: "Slug and Name are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { slug: editing.slug, name: editing.name, name_bn: editing.name_bn, icon: editing.icon, sort_order: editing.sort_order };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("categories").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("categories").insert(payload));
    }
    if (error) {
      toast({ title: "Error saving category", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category saved!" });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditing(null);
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category deleted" });
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Manage Categories</h2>
        <Button onClick={() => { setEditing({ ...emptyCategory, sort_order: categories.length + 1 }); setShowForm(true); }} className="gap-2 rounded-lg">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {showForm && editing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{editing.id ? "Edit Category" : "Add Category"}</h3>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditing(null); }}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Slug (URL key)</label>
              <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="e.g. phones" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Smartphones" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name (Bangla)</label>
              <Input value={editing.name_bn} onChange={(e) => setEditing({ ...editing, name_bn: e.target.value })} placeholder="স্মার্টফোন" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sort Order</label>
              <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Icon / Emoji</label>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl w-12 h-12 flex items-center justify-center bg-secondary rounded-lg">
                  {editing.icon.startsWith("http") ? <img src={editing.icon} alt="icon" className="w-8 h-8 object-contain" /> : editing.icon}
                </span>
                <Input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="Paste emoji or icon URL" className="flex-1" />
              </div>
              <p className="text-xs text-muted-foreground mb-2">Paste an emoji directly or an image URL (e.g. https://example.com/icon.png)</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((e) => (
                  <button key={e} type="button" onClick={() => setEditing({ ...editing!, icon: e })} className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all ${editing.icon === e ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-primary/50"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-4 rounded-lg gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Category
          </Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-muted-foreground font-medium w-12">#</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Icon</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Name</th>
              <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Slug</th>
              <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Bangla</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c: any) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                <td className="p-3 text-muted-foreground">{c.sort_order}</td>
                <td className="p-3 text-2xl">{c.icon}</td>
                <td className="p-3 font-medium text-foreground">{c.name}</td>
                <td className="p-3 text-muted-foreground hidden sm:table-cell">{c.slug}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell font-bangla">{c.name_bn}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing({ id: c.id, slug: c.slug, name: c.name, name_bn: c.name_bn, icon: c.icon, sort_order: c.sort_order }); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCategories;
