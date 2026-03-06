import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-display text-lg font-bold mb-3">
              <span className="text-gradient">HOLYNEX</span> LABS
            </h3>
            <p className="text-sm text-muted-foreground">
              Tecnologia com propósito. Desenvolvemos sistemas inteligentes para escalar negócios.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 text-sm">Navegação</h4>
            <div className="flex flex-col gap-2">
              {["Home", "Serviços", "Soluções", "Portfólio", "Sobre", "Contato"].map((l) => (
                <Link
                  key={l}
                  to={l === "Home" ? "/" : `/${l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 text-sm">Serviços</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>Desenvolvimento de SaaS</span>
              <span>Automação com IA</span>
              <span>Sistemas Empresariais</span>
              <span>Plataformas Digitais</span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 text-sm">Contato</h4>
            <p className="text-sm text-muted-foreground">contato@holynexlabs.com</p>
          </div>
        </div>
        <div className="border-t border-border/50 mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} HolyNex Labs. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
