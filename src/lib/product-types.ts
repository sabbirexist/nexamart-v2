export interface Product {
  id: string;
  name: string;
  nameBn: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  description: string;
  descriptionBn: string;
  specs: Record<string, string>;
  inStock: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  discount?: number;
}

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  icon: string;
  productCount: number;
}

export const formatPrice = (price: number): string => {
  return "৳" + price.toLocaleString("en-IN");
};

// Category display metadata - used for rendering category info
export const CATEGORY_META: Record<string, { name: string; nameBn: string; icon: string }> = {
  phones: { name: "Smartphones", nameBn: "স্মার্টফোন", icon: "📱" },
  earbuds: { name: "Earbuds & Audio", nameBn: "ইয়ারবাড ও অডিও", icon: "🎧" },
  smartwatches: { name: "Smart Watches", nameBn: "স্মার্ট ওয়াচ", icon: "⌚" },
  chargers: { name: "Chargers & Cables", nameBn: "চার্জার ও ক্যাবল", icon: "🔌" },
  cases: { name: "Cases & Covers", nameBn: "কেস ও কভার", icon: "🛡️" },
  powerbanks: { name: "Power Banks", nameBn: "পাওয়ার ব্যাংক", icon: "🔋" },
};
