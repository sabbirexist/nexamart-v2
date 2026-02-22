import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Loader2, FileText, Plus, Trash2 } from "lucide-react";

interface Page {
  id: string;
  slug: string;
  title: string;
  title_bn: string;
  content: string;
}

const AdminPages = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Page | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPages = async () => {
    const { data } = await supabase.from("pages").select("*").order("slug");
    setPages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.slug || !editing.title) {
      toast({ title: "Slug and Title are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    let error;
    if (isNew) {
      ({ error } = await supabase.from("pages").insert({
        slug: editing.slug,
        title: editing.title,
        title_bn: editing.title_bn,
        content: editing.content,
      }));
    } else {
      ({ error } = await supabase.from("pages").update({
        title: editing.title,
        title_bn: editing.title_bn,
        content: editing.content,
      }).eq("id", editing.id));
    }
    if (error) {
      toast({ title: "Error saving page", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Page saved!" });
      fetchPages();
      setEditing(null);
      setIsNew(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this page?")) return;
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting page", variant: "destructive" });
    } else {
      toast({ title: "Page deleted" });
      fetchPages();
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (editing) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{isNew ? "Add Page" : `Edit: ${editing.title}`}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }} className="rounded-lg">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-lg">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          {isNew && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Slug (URL key)</label>
              <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="e.g. about-us" />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
            <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title (Bangla)</label>
            <Input value={editing.title_bn} onChange={(e) => setEditing({ ...editing, title_bn: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Content (Markdown)</label>
            <Textarea
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              rows={20}
              className="font-mono text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Manage Pages</h2>
        <Button onClick={() => { setEditing({ id: "", slug: "", title: "", title_bn: "", content: "" }); setIsNew(true); }} className="gap-2 rounded-lg">
          <Plus className="h-4 w-4" /> Add Page
        </Button>
      </div>
      <div className="space-y-3">
        {pages.map((page) => (
          <div key={page.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">{page.title}</p>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => { setEditing({ ...page }); setIsNew(false); }} className="rounded-lg">
                Edit
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(page.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPages;
