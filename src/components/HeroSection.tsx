import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Shield, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-gadgets.jpg";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const HeroSection = () => {
  const { get } = useSiteSettings();

  const trustItems = [
    { icon: Truck, label: get("trust_1_label", "ঢাকায় ফ্রি ডেলিভারি"), sub: get("trust_1_sub", "Free delivery in Dhaka") },
    { icon: Shield, label: get("trust_2_label", "১০০% অরিজিনাল"), sub: get("trust_2_sub", "Genuine products guaranteed") },
    { icon: Headphones, label: get("trust_3_label", "২৪/৭ সাপোর্ট"), sub: get("trust_3_sub", "Always here to help") },
  ];

  return (
    <section className="relative overflow-hidden gradient-hero">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4 font-bangla">
              {get("hero_badge", "🇧🇩 বাংলাদেশে #১ গ্যাজেট শপ")}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
              {get("hero_title_1", "Premium Gadgets,")}
              <br />
              <span className="text-primary">{get("hero_title_2", "Best Prices")}</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-md">
              {get("hero_description", "অরিজিনাল ফোন, ইয়ারবাড, স্মার্টওয়াচ এবং আরও অনেক কিছু। সারাদেশে দ্রুত ডেলিভারি।")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={get("hero_btn_primary_url", "/products")}>
                <Button size="lg" className="gap-2 rounded-xl font-semibold">
                  {get("hero_btn_primary", "কিনুন – Shop Now")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={get("hero_btn_secondary_url", "/products?category=phones")}>
                <Button variant="outline" size="lg" className="rounded-xl">
                  {get("hero_btn_secondary", "Browse Phones")}
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
            <div className="p-3">
              <img src={heroImage} alt="Premium gadgets collection" className="w-full rounded-2xl border-[3px] border-dashed border-primary/40" />
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
          {trustItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground font-bangla">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
