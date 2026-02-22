import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Search, Menu, X, PackageSearch } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoImg from "@/assets/logo.png";

const Navbar = () => {
  const { totalItems } = useCart();
  const { data: products = [] } = useSupabaseProducts();
  const { get } = useSiteSettings();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 5);
  }, [searchQuery, products]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`); setSearchOpen(false); setSearchQuery(""); }
  };

  const handleSuggestionClick = (productId: string) => { navigate(`/product/${productId}`); setSearchOpen(false); setSearchQuery(""); };

  const siteName = get("site_name", "NexaMart");

  // Dynamic nav links
  const navLinks = [
    { label: get("nav_link_1", "Home"), url: get("nav_link_1_url", "/") },
    { label: get("nav_link_2", "All Products"), url: get("nav_link_2_url", "/products") },
    { label: get("nav_link_3", "Phones"), url: get("nav_link_3_url", "/products?category=phones") },
    { label: get("nav_link_4", "Audio"), url: get("nav_link_4_url", "/products?category=earbuds") },
    { label: get("nav_link_5", "Track Order"), url: get("nav_link_5_url", "/track-order") },
  ].filter((l) => l.label);

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input ref={searchRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search gadgets..." className="w-full h-10 rounded-lg border border-input bg-background pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 absolute right-1 top-1/2 -translate-y-1/2" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}><X className="h-4 w-4" /></Button>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  {suggestions.map((p) => (
                    <button key={p.id} type="button" onClick={() => handleSuggestionClick(p.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-left">
                      <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.brand} · ৳{p.price.toLocaleString("en-IN")}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>
          ) : (
            <>
              <Link to="/" className="flex items-center gap-2">
                <img src={logoImg} alt={siteName} className="w-8 h-8 rounded-lg object-contain" />
                <span className="text-xl font-bold text-foreground">
                  Nexa<span className="text-primary">Mart</span>
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((l, i) => (
                  <Link key={i} to={l.url} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSearchOpen(true)}><Search className="h-4 w-4" /></Button>
                <Link to="/wishlist"><Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex"><Heart className="h-4 w-4" /></Button></Link>
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <ShoppingCart className="h-4 w-4" />
                    {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{totalItems}</span>}
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
        {mobileMenuOpen && !searchOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-3">
              {navLinks.map((l, i) => (
                <Link key={i} to={l.url} className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1" onClick={() => setMobileMenuOpen(false)}>{l.label}</Link>
              ))}
              <Link to="/wishlist" className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
