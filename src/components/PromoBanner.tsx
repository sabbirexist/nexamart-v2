import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const PromoBanner = () => {
  const { get } = useSiteSettings();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-primary p-8 md:p-12"
        >
          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary-foreground" />
              <span className="text-primary-foreground/80 text-sm font-medium">{get("promo_label", "Limited Time Offer")}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
              {get("promo_title", "Up to 30% Off on Audio")}
            </h3>
            <p className="text-primary-foreground/70 mb-6 font-bangla">
              {get("promo_description", "সেরা ইয়ারবাড এবং হেডফোনে বিশাল ছাড়! সীমিত সময়ের জন্য।")}
            </p>
            <Link to={get("promo_btn_url", "/products?category=earbuds")}>
              <Button variant="secondary" size="lg" className="rounded-xl font-semibold">
                {get("promo_btn", "Shop Audio Deals")}
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-foreground/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-primary-foreground/5 translate-y-1/2" />
        </motion.div>
      </div>
    </section>
  );
};

export default PromoBanner;
