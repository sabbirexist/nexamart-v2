import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PolicyPage = () => {
  const { slug } = useParams();

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("pages").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!page) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found</p>
      </main>
    );
  }

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold text-foreground mt-6 mb-3">{line.slice(3)}</h2>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-foreground mt-4 mb-1">{line.slice(2, -2)}</p>;
      if (line.startsWith("- ")) return <li key={i} className="text-muted-foreground ml-4">{line.slice(2)}</li>;
      if (line.match(/^\d+\./)) return <li key={i} className="text-muted-foreground ml-4 list-decimal">{line.replace(/^\d+\.\s*/, "")}</li>;
      if (line.trim() === "") return <br key={i} />;
      // Handle bold within text
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="text-muted-foreground">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") 
              ? <strong key={j} className="text-foreground">{part.slice(2, -2)}</strong> 
              : part
          )}
        </p>
      );
    });
  };

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-1">{page.title}</h1>
        {page.title_bn && <p className="text-muted-foreground font-bangla mb-6">{page.title_bn}</p>}
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-1">
          {renderContent(page.content)}
        </div>
      </div>
    </main>
  );
};

export default PolicyPage;
