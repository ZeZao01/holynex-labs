import { motion, type Variants } from "framer-motion";
import { Target, Lightbulb, Rocket } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

export default function Sobre() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div className="text-center max-w-2xl mx-auto mb-16" initial="hidden" animate="visible">
          <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-wider">Sobre nós</motion.span>
          <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            Quem é a <span className="text-gradient">HolyNex Labs</span>
          </motion.h1>
        </motion.div>
        <div className="max-w-3xl mx-auto">
          <motion.div className="glass rounded-xl p-8 md:p-12 mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-lg text-foreground/80 leading-relaxed mb-6">
              A <span className="text-primary font-semibold">HolyNex Labs</span> é uma software house especializada no desenvolvimento de sistemas inteligentes, SaaS e plataformas digitais.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Nossa missão é transformar ideias em soluções tecnológicas escaláveis, ajudando empresas e empreendedores a crescer com automação e inovação.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Missão", desc: "Transformar ideias em soluções tecnológicas que geram resultado real." },
              { icon: Lightbulb, title: "Visão", desc: "Ser referência em desenvolvimento de sistemas inteligentes no Brasil." },
              { icon: Rocket, title: "Valores", desc: "Inovação, qualidade, compromisso com o resultado e transparência." },
            ].map((item, i) => (
              <motion.div key={item.title} className="glass rounded-xl p-6 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
