import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Footer from "@/components/Footer";
import AdminLayout from "@/components/AdminLayout";
import { AccessControlProvider } from "@/hooks/useAccessControl";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";

import Index from "./pages/Index";
import Servicos from "./pages/Servicos";
import PortfolioDetalhe from "./pages/PortfolioDetalhe";
import Modelos from "./pages/Modelos";
import ModeloDetalhe from "./pages/ModeloDetalhe";
import Solucoes from "./pages/Solucoes";
import Portfolio from "./pages/Portfolio";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import PropostaPublica from "./pages/PropostaPublica";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrcamentos from "./pages/AdminOrcamentos";
import AdminLeadDetalhe from "./pages/AdminLeadDetalhe";
import AdminPropostas from "./pages/AdminPropostas";
import AdminNovaProposta from "./pages/AdminNovaProposta";
import AdminPropostaDetalhe from "./pages/AdminPropostaDetalhe";

import AdminProjetos from "./pages/AdminProjetos";
import AdminProjetoDetalhe from "./pages/AdminProjetoDetalhe";
import AdminSistemas from "./pages/AdminSistemas";
import AdminSistemaDetalhe from "./pages/AdminSistemaDetalhe";
import AdminAcessos from "./pages/AdminAcessos";
import AdminModulos from "./pages/AdminModulos";
import AdminManutencao from "./pages/AdminManutencao";
import AdminPortfolioAdmin from "./pages/AdminPortfolioAdmin";
import AdminModelos from "./pages/AdminModelos";
import AdminFinanceiro from "./pages/AdminFinanceiro";
import AdminSeguranca from "./pages/AdminSeguranca";
import AdminConfiguracoes from "./pages/AdminConfiguracoes";
import AdminIA from "./pages/AdminIA";
import AdminAddons from "./pages/AdminAddons";
import AdminBrandStudio from "./pages/brand-studio/AdminBrandStudio";
import AdminBrandStudioProjetos from "./pages/brand-studio/AdminBrandStudioProjetos";
import AdminBrandStudioProjetoDetalhe from "./pages/brand-studio/AdminBrandStudioProjetoDetalhe";
import AdminBrandStudioBriefings from "./pages/brand-studio/AdminBrandStudioBriefings";
import AdminBrandStudioPrompts from "./pages/brand-studio/AdminBrandStudioPrompts";
import AdminBrandStudioApresentacoes from "./pages/brand-studio/AdminBrandStudioApresentacoes";
import AdminBrandStudioAssets from "./pages/brand-studio/AdminBrandStudioAssets";
import AdminBrandStudioConfiguracoes from "./pages/brand-studio/AdminBrandStudioConfiguracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin") && location.pathname !== "/admin/login";

  if (isAdmin) {
    return (
      <AdminLayout>
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
          <Route path="/admin/configuracoes" element={<AdminRouteGuard module="configuracoes"><AdminConfiguracoes /></AdminRouteGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AdminLayout>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <Navbar />
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
      <Footer />
      <WhatsAppFloat />
    </>
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
          </BrowserRouter>
        </AccessControlProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
