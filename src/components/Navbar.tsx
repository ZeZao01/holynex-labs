import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/servicos", label: t("nav.services") },
    { to: "/solucoes", label: t("nav.solutions") },
    { to: "/portfolio", label: t("nav.portfolio") },
    { to: "/sobre", label: t("nav.about") },
    { to: "/contato", label: t("nav.contact") },
  ];

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="container mx-auto flex items-center justify-between h-16 sm:h-20 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 relative z-10 group">
          <motion.img
            src={logo}
            alt="HolyNex Labs"
            className="h-8 w-8 sm:h-9 sm:w-9"
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight">
            <span className="text-gradient-animated">HOLYNEX</span>{" "}
            <span className="text-foreground">LABS</span>
          </span>
        </Link>

        {/* Desktop — Pill nav */}
        <div className="hidden lg:flex items-center">
          <div className="nav-pill flex items-center gap-1 px-2 py-1.5">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`nav-link-animated text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 ${
                  location.pathname === l.to
                    ? "text-primary bg-primary/10 active"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop CTA + Lang */}
        <div className="hidden lg:flex items-center gap-3">
          <LanguageSelector />
          <Link
            to="/contato"
            className="btn-glow inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-foreground"
          >
            {t("nav.cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile: lang + toggle */}
        <div className="flex lg:hidden items-center gap-2">
          <LanguageSelector />
          <motion.button
            className="text-foreground relative z-[60] w-10 h-10 flex items-center justify-center rounded-full glass"
            onClick={() => setOpen(!open)}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X size={20} />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="lg:hidden fixed inset-0 z-50 bg-background/98 backdrop-blur-3xl"
            initial={{ opacity: 0, clipPath: "circle(0% at 95% 5%)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at 95% 5%)" }}
            exit={{ opacity: 0, clipPath: "circle(0% at 95% 5%)" }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <motion.img
                src={logo}
                alt="HolyNex Labs"
                className="h-14 w-14 sm:h-16 sm:w-16 mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              />
              {links.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
                >
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={`text-xl sm:text-2xl font-display font-semibold py-3 px-8 rounded-xl transition-all duration-300 block ${
                      location.pathname === l.to
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-6"
              >
                <Link
                  to="/contato"
                  onClick={() => setOpen(false)}
                  className="btn-glow inline-flex items-center gap-2 px-8 py-3 rounded-full text-base font-semibold text-foreground"
                >
                  {t("nav.cta")}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
