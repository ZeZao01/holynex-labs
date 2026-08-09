import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/AdminSidebar";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const ROUTE_LABELS: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/orcamentos": "Leads & Orçamentos",
  "/admin/propostas": "Propostas",
  "/admin/propostas/nova": "Nova Proposta",
  "/admin/templates": "Modelos PDF",
  "/admin/projetos": "Projetos",
  "/admin/sistemas": "Sistemas Entregues",
  "/admin/acessos": "Acessos & Credenciais",
  "/admin/modulos": "Módulos",
  "/admin/manutencao": "Manutenção",
  "/admin/portfolio-admin": "Portfólio",
  "/admin/modelos": "Projetos Modelo",
  "/admin/financeiro": "Financeiro",
  "/admin/ia": "IA Assistiva",
  "/admin/brand-studio": "Brand Studio AI",
  "/admin/brand-studio/projetos": "Brand Studio · Projetos",
  "/admin/brand-studio/briefings": "Brand Studio · Briefings",
  "/admin/brand-studio/prompts": "Brand Studio · Prompts",
  "/admin/brand-studio/apresentacoes": "Brand Studio · Apresentacoes",
  "/admin/brand-studio/assets": "Brand Studio · Assets",
  "/admin/brand-studio/configuracoes": "Brand Studio · Configuracoes",
  "/admin/qg": "QG Agência",
  "/admin/seguranca": "Segurança",
  "/admin/addons": "Add-ons Ocultos",
  "/admin/configuracoes": "Configurações",
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const currentLabel =
    ROUTE_LABELS[location.pathname] ||
    (location.pathname.startsWith("/admin/brand-studio/projetos/") ? "Brand Studio · Projeto" : "Painel");

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AdminSidebar />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <header className="h-12 flex items-center border-b border-border/40 bg-card/60 backdrop-blur-sm sticky top-0 z-20 px-3 gap-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">HolyNex Admin</span>
              <span className="text-muted-foreground/40 hidden sm:inline">/</span>
              <span className="text-sm font-medium text-foreground truncate">{currentLabel}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary hidden md:flex">
                Operacional
              </Badge>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
