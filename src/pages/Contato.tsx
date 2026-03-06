import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Send, ArrowRight } from "lucide-react";
import RevealBox from "@/components/RevealBox";
import { salvarOrcamento } from "@/lib/orcamentos";

export default function Contato() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    setTimeout(() => {
      salvarOrcamento({
        nome: (formData.get("nome") as string) || "",
        email: (formData.get("email") as string) || "",
        empresa: (formData.get("empresa") as string) || "",
        descricao: (formData.get("descricao") as string) || "",
      });
      setLoading(false);
      toast.success("Solicitação enviada com sucesso! Entraremos em contato em breve.");
      form.reset();
    }, 1000);
  };

  return (
    <div className="min-h-screen pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Contato</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">Vamos conversar sobre seu projeto</h1>
          <p className="text-muted-foreground">Preencha o formulário abaixo e nossa equipe entrará em contato.</p>
        </RevealBox>
        <RevealBox delay={0.2} className="max-w-lg mx-auto card-animated glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome</label>
              <Input name="nome" required placeholder="Seu nome completo" className="bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input name="email" required type="email" placeholder="seu@email.com" className="bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Empresa</label>
              <Input name="empresa" placeholder="Nome da empresa (opcional)" className="bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo de projeto</label>
              <Textarea name="descricao" required placeholder="Descreva brevemente o que você precisa..." rows={4} className="bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-glow inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-semibold text-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {loading ? "Enviando..." : "Solicitar orçamento"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </RevealBox>
      </div>
    </div>
  );
}
