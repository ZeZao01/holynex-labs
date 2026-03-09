import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  const navLinks = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.services"), to: "/servicos" },
    { label: t("nav.solutions"), to: "/solucoes" },
    { label: t("nav.portfolio"), to: "/portfolio" },
    { label: t("nav.about"), to: "/sobre" },
    { label: t("nav.contact"), to: "/contato" },
  ];

  return (
    <footer className="border-t border-border/50 bg-card/30 relative z-10">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="HolyNex Labs" className="h-8 w-8" />
              <span className="font-display text-lg font-bold">
                <span className="text-gradient">HOLYNEX</span> LABS
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("footer.desc")}</p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 sm:mb-4 text-sm">{t("footer.nav")}</h4>
            <div className="flex flex-col gap-2">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 sm:mb-4 text-sm">{t("footer.services")}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>{t("service.saas")}</span>
              <span>{t("service.ai")}</span>
              <span>{t("service.enterprise")}</span>
              <span>{t("service.platforms")}</span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 sm:mb-4 text-sm">{t("footer.contact")}</h4>
            <p className="text-sm text-muted-foreground">contato@holynexlabs.com</p>
          </div>
        </div>
        <div className="border-t border-border/50 mt-8 sm:mt-10 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} HolyNex Labs. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
