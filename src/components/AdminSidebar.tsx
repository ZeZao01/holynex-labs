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
  ClipboardList,
  Sparkles,
  Palette,
  Network,
  UserRoundSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { ROLE_LABELS } from "@/lib/security";
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

interface SidebarItem {
  title: string;
  url: string;
  icon: LucideIcon;
  module: string;
  action?: string;
}

const principalItems: SidebarItem[] = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { title: "QG Agência", url: "/admin/qg", icon: Network, module: "configuracoes" },
];

const comercialItems: SidebarItem[] = [
  { title: "Leads & Orçamentos", url: "/admin/orcamentos", icon: Users, module: "leads" },
  { title: "Prospectar leads", url: "/admin/orcamentos?captar=1", icon: UserRoundSearch, module: "leads", action: "criar" },
  { title: "Propostas", url: "/admin/propostas", icon: ClipboardList, module: "propostas" },
];

const projetosItems: SidebarItem[] = [
  { title: "Projetos", url: "/admin/projetos", icon: FolderKanban, module: "projetos" },
  { title: "Sistemas Entregues", url: "/admin/sistemas", icon: PackageCheck, module: "sistemas" },
  { title: "Acessos & Credenciais", url: "/admin/acessos", icon: KeyRound, module: "acessos" },
  { title: "Módulos", url: "/admin/modulos", icon: Blocks, module: "modulos" },
  { title: "Manutenção", url: "/admin/manutencao", icon: Wrench, module: "manutencao" },
];

const ferramentasItems: SidebarItem[] = [
  { title: "Brand Studio AI", url: "/admin/brand-studio", icon: Palette, module: "brand_studio" },
  { title: "Projetos Modelo", url: "/admin/modelos", icon: LayoutTemplate, module: "modelos" },
  { title: "Portfólio Público", url: "/admin/portfolio-admin", icon: Globe, module: "portfolio" },
  { title: "Financeiro", url: "/admin/financeiro", icon: DollarSign, module: "financeiro" },
];

const sistemaItems: SidebarItem[] = [
  { title: "IA & Automações", url: "/admin/ia", icon: Sparkles, module: "ia" },
  { title: "Segurança & Auditoria", url: "/admin/seguranca", icon: ShieldCheck, module: "seguranca" },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings, module: "configuracoes" },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { canView, canCreate, roles, loading: accessLoading, isDevAdmin } = useAccessControl();

  const isActive = (url: string) => {
    const [path, search = ""] = url.split("?");
    if (search) return location.pathname === path && new URLSearchParams(location.search).get("captar") === "1";
    if (path === "/admin/orcamentos") return location.pathname === path && new URLSearchParams(location.search).get("captar") !== "1";
    if (path === "/admin/dashboard") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const filterItems = (items: SidebarItem[]) =>
    items.filter((item) => {
      if (accessLoading) return true;
      if (item.action === "criar") return canCreate(item.module);
      return canView(item.module);
    });

  const renderItems = (items: SidebarItem[]) => {
    const filtered = filterItems(items);
    if (filtered.length === 0) return null;

    return (
      <SidebarMenu>
        {filtered.map((item) => (
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
  };

  const renderGroup = (label: string, items: SidebarItem[]) => {
    const filtered = filterItems(items);
    if (filtered.length === 0) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>{renderItems(items)}</SidebarGroupContent>
      </SidebarGroup>
    );
  };

  // Derive display role
  const primaryRole = roles[0] || "somente_leitura";
  const roleLabel = ROLE_LABELS[primaryRole] || primaryRole;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/admin/dashboard")}>
          <img src={logo} alt="HolyNex" className="h-8 w-8 rounded-md" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground tracking-tight leading-none">
                HolyNex
              </span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Painel Admin</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Principal", principalItems)}
        {renderGroup("Comercial", comercialItems)}
        {renderGroup("Operacional", projetosItems)}
        {renderGroup("Ferramentas", ferramentasItems)}
        {renderGroup("Administração", sistemaItems)}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            <p className="text-[10px] text-primary/80 font-medium">{roleLabel}</p>
          </div>
        )}
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
