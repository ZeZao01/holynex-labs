import {
  LayoutDashboard,
  Users,
  FileText,
  FolderKanban,
  PackageCheck,
  KeyRound,
  Blocks,
  Wrench,
  Globe,
  LayoutTemplate,
  DollarSign,
  ShieldCheck,
  Settings,
  LogOut,
  Palette,
  FilePlus,
  ClipboardList,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";

const operacionalItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Leads & Orçamentos", url: "/admin/orcamentos", icon: Users },
  { title: "Propostas & PDFs", url: "/admin/propostas", icon: ClipboardList },
  { title: "Nova Proposta", url: "/admin/propostas/nova", icon: FilePlus },
  { title: "Modelos PDF", url: "/admin/templates", icon: Palette },
];

const projetosItems = [
  { title: "Projetos em Andamento", url: "/admin/projetos", icon: FolderKanban },
  { title: "Sistemas Entregues", url: "/admin/sistemas", icon: PackageCheck },
  { title: "Acessos & Admins", url: "/admin/acessos", icon: KeyRound },
  { title: "Módulos por Projeto", url: "/admin/modulos", icon: Blocks },
  { title: "Alterações & Manutenção", url: "/admin/manutencao", icon: Wrench },
];

const comercialItems = [
  { title: "Portfólio Público", url: "/admin/portfolio-admin", icon: Globe },
  { title: "Projetos Modelo", url: "/admin/modelos", icon: LayoutTemplate },
  { title: "Financeiro", url: "/admin/financeiro", icon: DollarSign },
];

const sistemaItems = [
  { title: "Segurança & Auditoria", url: "/admin/seguranca", icon: ShieldCheck },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const renderItems = (items: typeof operacionalItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            isActive={isActive(item.url)}
            onClick={() => navigate(item.url)}
            tooltip={item.title}
          >
            <item.icon className="h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/admin/dashboard")}>
          <img src={logo} alt="HolyNex" className="h-8 w-8 rounded-md" />
          {!collapsed && (
            <span className="text-sm font-bold text-foreground tracking-tight">
              HolyNex Admin
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operacional</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(operacionalItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Projetos</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(projetosItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Comercial</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(comercialItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(sistemaItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                signOut();
                navigate("/admin/login");
              }}
              tooltip="Sair"
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
