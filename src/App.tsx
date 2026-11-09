import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useIsFetching } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ChatAtendimento from "@/components/ChatAtendimento";
import Footer from "@/components/Footer";
import AdminLayout from "@/components/AdminLayout";
import { AccessControlProvider } from "@/hooks/useAccessControl";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import LoadingOverlay from "@/components/LoadingOverlay";
import { Loader2 } from "lucide-react";

const Index = lazy(() => import("./pages/Index"));
const Servicos = lazy(() => import("./pages/Servicos"));
const PortfolioDetalhe = lazy(() => import("./pages/PortfolioDetalhe"));
const Modelos = lazy(() => import("./pages/Modelos"));
const ModeloDetalhe = lazy(() => import("./pages/ModeloDetalhe"));
const Solucoes = lazy(() => import("./pages/Solucoes"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Sobre = lazy(() => import("./pages/Sobre"));
const Contato = lazy(() => import("./pages/Contato"));
const PropostaPublica = lazy(() => import("./pages/PropostaPublica"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminOrcamentos = lazy(() => import("./pages/AdminOrcamentos"));
const AdminLeadDetalhe = lazy(() => import("./pages/AdminLeadDetalhe"));
const AdminPropostas = lazy(() => import("./pages/AdminPropostas"));
const AdminNovaProposta = lazy(() => import("./pages/AdminNovaProposta"));
const AdminPropostaDetalhe = lazy(() => import("./pages/AdminPropostaDetalhe"));
const AdminProjetos = lazy(() => import("./pages/AdminProjetos"));
const AdminProjetoDetalhe = lazy(() => import("./pages/AdminProjetoDetalhe"));
const AdminSistemas = lazy(() => import("./pages/AdminSistemas"));
const AdminSistemaDetalhe = lazy(() => import("./pages/AdminSistemaDetalhe"));
const AdminAcessos = lazy(() => import("./pages/AdminAcessos"));
const AdminModulos = lazy(() => import("./pages/AdminModulos"));
const AdminManutencao = lazy(() => import("./pages/AdminManutencao"));
const AdminPortfolioAdmin = lazy(() => import("./pages/AdminPortfolioAdmin"));
const AdminModelos = lazy(() => import("./pages/AdminModelos"));
const AdminFinanceiro = lazy(() => import("./pages/AdminFinanceiro"));
const AdminSeguranca = lazy(() => import("./pages/AdminSeguranca"));
const AdminConfiguracoes = lazy(() => import("./pages/AdminConfiguracoes"));
const AdminIA = lazy(() => import("./pages/AdminIA"));
const AdminAddons = lazy(() => import("./pages/AdminAddons"));
const AdminQGHub = lazy(() => import("./pages/AdminQGHub"));
const AdminBrandStudio = lazy(() => import("./pages/brand-studio/AdminBrandStudio"));
const AdminBrandStudioProjetos = lazy(() => import("./pages/brand-studio/AdminBrandStudioProjetos"));
const AdminBrandStudioProjetoDetalhe = lazy(() => import("./pages/brand-studio/AdminBrandStudioProjetoDetalhe"));
const AdminBrandStudioBriefings = lazy(() => import("./pages/brand-studio/AdminBrandStudioBriefings"));
const AdminBrandStudioPrompts = lazy(() => import("./pages/brand-studio/AdminBrandStudioPrompts"));
const AdminBrandStudioApresentacoes = lazy(() => import("./pages/brand-studio/AdminBrandStudioApresentacoes"));
const AdminBrandStudioAssets = lazy(() => import("./pages/brand-studio/AdminBrandStudioAssets"));
const AdminBrandStudioConfiguracoes = lazy(() => import("./pages/brand-studio/AdminBrandStudioConfiguracoes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin") && location.pathname !== "/admin/login";
  const isFetching = useIsFetching();
  const showDataLoading = isFetching > 0;

  if (isAdmin) {
    return (
      <AdminLayout>
        <Suspense fallback={<AdminContentLoading />}>
          <Routes>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminRouteGuard module="dashboard"><AdminDashboard /></AdminRouteGuard>} />
            <Route path="/admin/orcamentos" element={<AdminRouteGuard module="leads"><AdminOrcamentos /></AdminRouteGuard>} />
            <Route path="/admin/orcamentos/:id" element={<AdminRouteGuard module="leads"><AdminLeadDetalhe /></AdminRouteGuard>} />
            <Route path="/admin/propostas" element={<AdminRouteGuard module="propostas"><AdminPropostas /></AdminRouteGuard>} />
            <Route path="/admin/propostas/nova" element={<AdminRouteGuard module="propostas" action="criar"><AdminNovaProposta /></AdminRouteGuard>} />
            <Route path="/admin/propostas/:id" element={<AdminRouteGuard module="propostas"><AdminPropostaDetalhe /></AdminRouteGuard>} />
            
            <Route path="/admin/projetos" element={<AdminRouteGuard module="projetos"><AdminProjetos /></AdminRouteGuard>} />
            <Route path="/admin/projetos/:id" element={<AdminRouteGuard module="projetos"><AdminProjetoDetalhe /></AdminRouteGuard>} />
            <Route path="/admin/sistemas" element={<AdminRouteGuard module="sistemas"><AdminSistemas /></AdminRouteGuard>} />
            <Route path="/admin/sistemas/:id" element={<AdminRouteGuard module="sistemas"><AdminSistemaDetalhe /></AdminRouteGuard>} />
            <Route path="/admin/acessos" element={<AdminRouteGuard module="acessos"><AdminAcessos /></AdminRouteGuard>} />
            <Route path="/admin/modulos" element={<AdminRouteGuard module="modulos"><AdminModulos /></AdminRouteGuard>} />
            <Route path="/admin/manutencao" element={<AdminRouteGuard module="manutencao"><AdminManutencao /></AdminRouteGuard>} />
            <Route path="/admin/portfolio-admin" element={<AdminRouteGuard module="portfolio"><AdminPortfolioAdmin /></AdminRouteGuard>} />
            <Route path="/admin/modelos" element={<AdminRouteGuard module="modelos"><AdminModelos /></AdminRouteGuard>} />
            <Route path="/admin/financeiro" element={<AdminRouteGuard module="financeiro"><AdminFinanceiro /></AdminRouteGuard>} />
            <Route path="/admin/ia" element={<AdminRouteGuard module="ia"><AdminIA /></AdminRouteGuard>} />
            <Route path="/admin/brand-studio" element={<AdminRouteGuard module="brand_studio"><AdminBrandStudio /></AdminRouteGuard>} />
            <Route path="/admin/brand-studio/projetos" element={<AdminRouteGuard module="brand_studio"><AdminBrandStudioProjetos /></AdminRouteGuard>} />
            <Route path="/admin/brand-studio/projetos/:id" element={<AdminRouteGuard module="brand_studio"><AdminBrandStudioProjetoDetalhe /></AdminRouteGuard>} />
            <Route path="/admin/brand-studio/briefings" element={<AdminRouteGuard module="brand_studio"><AdminBrandStudioBriefings /></AdminRouteGuard>} />
            <Route path="/admin/brand-studio/prompts" element={<AdminRouteGuard module="brand_studio"><AdminBrandStudioPrompts /></AdminRouteGuard>} />
            <Route path="/admin/brand-studio/apresentacoes" element={<AdminRouteGuard module="brand_studio"><AdminBrandStudioApresentacoes /></AdminRouteGuard>} />
            <Route path="/admin/brand-studio/assets" element={<AdminRouteGuard module="brand_studio"><AdminBrandStudioAssets /></AdminRouteGuard>} />
            <Route path="/admin/brand-studio/configuracoes" element={<AdminRouteGuard module="brand_studio"><AdminBrandStudioConfiguracoes /></AdminRouteGuard>} />
            <Route path="/admin/seguranca" element={<AdminRouteGuard module="seguranca"><AdminSeguranca /></AdminRouteGuard>} />
            <Route path="/admin/addons" element={<AdminRouteGuard module="addons"><AdminAddons /></AdminRouteGuard>} />
            <Route path="/admin/qg" element={<AdminRouteGuard module="configuracoes"><AdminQGHub /></AdminRouteGuard>} />
            <Route path="/admin/configuracoes" element={<AdminRouteGuard module="configuracoes"><AdminConfiguracoes /></AdminRouteGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AdminLayout>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <Suspense fallback={<LoadingOverlay active label="Carregando conteúdo" />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/solucoes" element={<Solucoes />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:id" element={<PortfolioDetalhe />} />
          <Route path="/modelos" element={<Modelos />} />
          <Route path="/modelos/:slug" element={<ModeloDetalhe />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/proposta/:token" element={<PropostaPublica />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
      <WhatsAppFloat />
      <LoadingOverlay active={showDataLoading} label="Carregando dados" />
    </>
  );
}

function AdminContentLoading() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/70 px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Carregando seção…
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <AccessControlProvider>
          <BrowserRouter>
            <AppRoutes />
            <ChatAtendimento />
          </BrowserRouter>
        </AccessControlProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
