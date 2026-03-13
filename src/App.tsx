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

import Index from "./pages/Index";
import Servicos from "./pages/Servicos";
import Solucoes from "./pages/Solucoes";
import Portfolio from "./pages/Portfolio";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrcamentos from "./pages/AdminOrcamentos";
import AdminPropostas from "./pages/AdminPropostas";
import AdminNovaProposta from "./pages/AdminNovaProposta";
import AdminPropostaDetalhe from "./pages/AdminPropostaDetalhe";
import AdminTemplates from "./pages/AdminTemplates";
import AdminProjetos from "./pages/AdminProjetos";
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
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orcamentos" element={<AdminOrcamentos />} />
          <Route path="/admin/propostas" element={<AdminPropostas />} />
          <Route path="/admin/propostas/nova" element={<AdminNovaProposta />} />
          <Route path="/admin/propostas/:id" element={<AdminPropostaDetalhe />} />
          <Route path="/admin/templates" element={<AdminTemplates />} />
          <Route path="/admin/projetos" element={<AdminProjetos />} />
          <Route path="/admin/sistemas" element={<AdminSistemas />} />
          <Route path="/admin/acessos" element={<AdminAcessos />} />
          <Route path="/admin/modulos" element={<AdminModulos />} />
          <Route path="/admin/manutencao" element={<AdminManutencao />} />
          <Route path="/admin/portfolio-admin" element={<AdminPortfolioAdmin />} />
          <Route path="/admin/modelos" element={<AdminModelos />} />
          <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
          <Route path="/admin/seguranca" element={<AdminSeguranca />} />
          <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
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
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/contato" element={<Contato />} />
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
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
