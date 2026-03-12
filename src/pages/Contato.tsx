import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Send, ArrowRight } from "lucide-react";
import RevealBox from "@/components/RevealBox";
import { salvarOrcamento } from "@/lib/orcamentos";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Contato() {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await salvarOrcamento({
        nome: (formData.get("nome") as string) || "",
        email: (formData.get("email") as string) || "",
        empresa: (formData.get("empresa") as string) || "",
        descricao: (formData.get("descricao") as string) || "",
      });
      toast.success(t("contact.success"));
      form.reset();
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("nav.contact")}</span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">{t("contact.title")}</h1>
          <p className="text-muted-foreground">{t("contact.desc")}</p>
        </RevealBox>
        <RevealBox delay={0.2} className="max-w-lg mx-auto card-animated glass rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("contact.name")}</label>
              <Input name="nome" required placeholder={t("contact.name.placeholder")} className="bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("contact.email")}</label>
              <Input name="email" required type="email" placeholder={t("contact.email.placeholder")} className="bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("contact.company")}</label>
              <Input name="empresa" placeholder={t("contact.company.placeholder")} className="bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("contact.project")}</label>
              <Textarea name="descricao" required placeholder={t("contact.project.placeholder")} rows={4} className="bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-glow inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm sm:text-base font-semibold text-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {loading ? t("contact.sending") : t("contact.submit")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </RevealBox>
      </div>
    </div>
  );
}
