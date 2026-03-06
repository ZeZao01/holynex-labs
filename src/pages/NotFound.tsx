import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center relative z-10">
      <div className="text-center px-4">
        <h1 className="mb-4 text-6xl sm:text-8xl font-display font-bold text-gradient-animated">404</h1>
        <p className="mb-6 text-lg sm:text-xl text-muted-foreground">{t("notfound.title")}</p>
        <a href="/" className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-foreground">
          {t("notfound.back")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
