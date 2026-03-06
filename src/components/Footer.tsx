import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30 relative z-10">
      <div className="container mx-auto px-4 py-14">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <img src={logo} alt="HolyNex Labs" className="h-8 w-8" />
              <span className="font-display text-lg font-bold">
                <span className="text-gradient">HOLYNEX</span> LABS
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tecnologia com propósito. Desenvolvemos sistemas inteligentes para escalar negócios.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm">Navegação</h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Home", to: "/" },
                { label: "Serviços", to: "/servicos" },
                { label: "Soluções", to: "/solucoes" },
                { label: "Portfólio", to: "/portfolio" },
                { label: "Sobre", to: "/sobre" },
                { label: "Contato", to: "/contato" },
              ].map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm">Serviços</h4>
            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <span>Desenvolvimento de SaaS</span>
              <span>Automação com IA</span>
              <span>Sistemas Empresariais</span>
              <span>Plataformas Digitais</span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm">Contato</h4>
            <p className="text-sm text-muted-foreground">contato@holynexlabs.com</p>
          </div>
        </div>
        <div className="border-t border-border/50 mt-10 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} HolyNex Labs. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
