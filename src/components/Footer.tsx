import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoImg from "@/assets/logo.png";

const Footer = () => {
  const { get } = useSiteSettings();
  const phone = get("contact_phone", "+880 1700-000000");
  const email = get("contact_email", "support@nexamart.com");

  const quickLinks = [
    { label: get("footer_ql_1", "All Products"), url: get("footer_ql_1_url", "/products") },
    { label: get("footer_ql_2", "Smartphones"), url: get("footer_ql_2_url", "/products?category=phones") },
    { label: get("footer_ql_3", "Earbuds & Audio"), url: get("footer_ql_3_url", "/products?category=earbuds") },
    { label: get("footer_ql_4", "Track Order"), url: get("footer_ql_4_url", "/track-order") },
  ].filter((l) => l.label);

  const supportLinks = [
    { label: get("footer_sp_1", "Shipping Policy"), url: get("footer_sp_1_url", "/page/shipping-policy") },
    { label: get("footer_sp_2", "Return & Refund"), url: get("footer_sp_2_url", "/page/return-refund") },
    { label: get("footer_sp_3", "Privacy Policy"), url: get("footer_sp_3_url", "/page/privacy-policy") },
    { label: get("footer_sp_4", "Terms of Service"), url: get("footer_sp_4_url", "/page/terms-of-service") },
  ].filter((l) => l.label);

  const siteName = get("site_name", "NexaMart");

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logoImg} alt={siteName} className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-xl font-bold text-foreground">
                {siteName.split(/(?=[A-Z])/).map((part, i) => i === 1 ? <span key={i} className="text-primary">{part}</span> : part)}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed font-bangla">
              {get("footer_description", "বাংলাদেশের সবচেয়ে বিশ্বস্ত গ্যাজেট শপ। অরিজিনাল পণ্য, দ্রুত ডেলিভারি।")}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{get("footer_quicklinks_title", "Quick Links")}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {quickLinks.map((l, i) => (
                <Link key={i} to={l.url} className="hover:text-foreground transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{get("footer_support_title", "Support")}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {supportLinks.map((l, i) => (
                <Link key={i} to={l.url} className="hover:text-foreground transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{get("contact_title", "Contact")}</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                <span>{email}</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{get("contact_address", "Gulshan, Dhaka 1212")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          {get("copyright_text", "© 2026 NexaMart. All rights reserved.")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
