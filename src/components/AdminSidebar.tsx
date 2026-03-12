import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  HelpCircle,
  ClipboardList,
  FilePlus,
  LogOut,
  Palette,
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

const mainItems = [
  { title: "Painel de Controle", url: "/admin/orcamentos", icon: LayoutDashboard },
  { title: "Propostas", url: "/admin/propostas", icon: ClipboardList },
  { title: "Nova Proposta", url: "/admin/propostas/nova", icon: FilePlus },
];

const managementItems = [
  { title: "Usuários", url: "/admin/usuarios", icon: Users },
  { title: "Conteúdo", url: "/admin/conteudo", icon: FileText },
  { title: "Relatórios", url: "/admin/relatorios", icon: BarChart3 },
];

const systemItems = [
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
  { title: "Suporte", url: "/admin/suporte", icon: HelpCircle },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const renderItems = (items: typeof mainItems) => (
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
        <div className="flex items-center gap-3">
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
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(mainItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(managementItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(systemItems)}</SidebarGroupContent>
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
