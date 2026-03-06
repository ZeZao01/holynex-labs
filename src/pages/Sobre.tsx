import { Target, Lightbulb, Rocket } from "lucide-react";
import RevealBox from "@/components/RevealBox";

export default function Sobre() {
  return (
    <div className="min-h-screen pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Sobre nós</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            Quem é a <span className="text-gradient-animated">HolyNex Labs</span>
          </h1>
        </RevealBox>
        <div className="max-w-3xl mx-auto">
          <RevealBox className="card-animated glass rounded-2xl p-8 md:p-12 mb-12">
            <p className="text-lg text-foreground/80 leading-relaxed mb-6">
              A <span className="text-primary font-semibold">HolyNex Labs</span> é uma software house especializada no desenvolvimento de sistemas inteligentes, SaaS e plataformas digitais.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Nossa missão é transformar ideias em soluções tecnológicas escaláveis, ajudando empresas e empreendedores a crescer com automação e inovação.
            </p>
          </RevealBox>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Missão", desc: "Transformar ideias em soluções tecnológicas que geram resultado real." },
              { icon: Lightbulb, title: "Visão", desc: "Ser referência em desenvolvimento de sistemas inteligentes no Brasil." },
              { icon: Rocket, title: "Valores", desc: "Inovação, qualidade, compromisso com o resultado e transparência." },
            ].map((item, i) => (
              <RevealBox key={item.title} delay={i * 0.12} className="card-animated glass rounded-2xl p-6 text-center group">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2 text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </RevealBox>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
