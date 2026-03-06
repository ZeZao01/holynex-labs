import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Send } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

export default function Contato() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Solicitação enviada com sucesso! Entraremos em contato em breve.");
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div className="text-center max-w-2xl mx-auto mb-16" initial="hidden" animate="visible">
          <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-wider">
            Contato
          </motion.span>
          <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            Vamos conversar sobre seu projeto
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground">
            Preencha o formulário abaixo e nossa equipe entrará em contato.
          </motion.p>
        </motion.div>

        <motion.div
          className="max-w-lg mx-auto glass rounded-xl p-8"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome</label>
              <Input required placeholder="Seu nome completo" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input required type="email" placeholder="seu@email.com" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Empresa</label>
              <Input placeholder="Nome da empresa (opcional)" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo de projeto</label>
              <Textarea required placeholder="Descreva brevemente o que você precisa..." rows={4} className="bg-muted/50 border-border/50" />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-purple border-0 text-base font-semibold hover:opacity-90"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Enviando..." : "Solicitar orçamento"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
