/**
 * Niche Intelligence for PDF Generation.
 * Adapts terminology, KPIs, risk matrices, and strategic insights
 * based on the project's segment/niche.
 */

export interface NicheProfile {
  segment: string;
  kpis: { icon: string; label: string; metric: string }[];
  risks: { title: string; impact: string; mitigation: string; severity: "alto" | "medio" | "baixo" }[];
  strategicBenefits: { title: string; desc: string }[];
  maintenanceFeatures: string[];
  timelinePhases: { title: string; subtitle: string; desc: string }[];
  scopeLabels: { landing: string; user: string; admin: string };
  investmentJustification: string;
  expertReference: string;
}

const NICHE_PROFILES: Record<string, Partial<NicheProfile>> = {
  saude: {
    kpis: [
      { icon: "♥", label: "Retenção de Pacientes", metric: "+35%" },
      { icon: "⏱", label: "Tempo de Espera", metric: "-40%" },
      { icon: "📊", label: "Eficiência Operacional", metric: "+60%" },
      { icon: "⭐", label: "NPS Esperado", metric: "85+" },
    ],
    risks: [
      { title: "Conformidade LGPD/HIPAA", impact: "Multas e sanções regulatórias", mitigation: "Criptografia end-to-end + auditoria contínua", severity: "alto" },
      { title: "Integração com Prontuários", impact: "Dados inconsistentes", mitigation: "APIs HL7/FHIR padronizadas", severity: "medio" },
      { title: "Disponibilidade do Sistema", impact: "Perda de agendamentos", mitigation: "Infraestrutura com 99.9% SLA", severity: "alto" },
    ],
    strategicBenefits: [
      { title: "Automação Clínica", desc: "Redução de 40% no tempo administrativo segundo Harvard Medical School (2023)." },
      { title: "Experiência do Paciente", desc: "Sistemas digitais aumentam satisfação em 35% (McKinsey Health, 2024)." },
      { title: "Dados Preditivos", desc: "Analytics para prever demanda e otimizar recursos humanos." },
    ],
    maintenanceFeatures: ["Monitoramento de compliance LGPD", "Backup diário de dados sensíveis", "Atualizações de segurança prioritárias", "Suporte técnico especializado em saúde"],
    scopeLabels: { landing: "Portal do Paciente", user: "Área do Paciente", admin: "Painel Clínico" },
    investmentJustification: "Segundo a Deloitte (2024), clínicas que investem em sistemas digitais reduzem custos operacionais em até 30% no primeiro ano.",
    expertReference: "Ref: Harvard Business Review - Digital Health Transformation (2024); McKinsey & Company - The Future of Healthcare Systems",
  },
  educacao: {
    kpis: [
      { icon: "🎓", label: "Engajamento dos Alunos", metric: "+45%" },
      { icon: "📈", label: "Taxa de Conclusão", metric: "+30%" },
      { icon: "⏱", label: "Tempo de Gestão", metric: "-50%" },
      { icon: "⭐", label: "Satisfação Docente", metric: "90+" },
    ],
    risks: [
      { title: "Adoção pelos Usuários", impact: "Baixa utilização da plataforma", mitigation: "Onboarding guiado + treinamento presencial", severity: "medio" },
      { title: "Escalabilidade", impact: "Performance em períodos de pico (matrículas)", mitigation: "Arquitetura serverless auto-escalável", severity: "medio" },
      { title: "Proteção de Dados de Menores", impact: "Violação da LGPD", mitigation: "Controles parentais + consentimento explícito", severity: "alto" },
    ],
    strategicBenefits: [
      { title: "Aprendizagem Personalizada", desc: "Plataformas adaptativas aumentam performance em 25% (UNESCO, 2023)." },
      { title: "Gestão Acadêmica", desc: "Automatização reduz carga administrativa em 50% (EdTech Magazine, 2024)." },
      { title: "Análise de Desempenho", desc: "Dashboards preditivos para intervenção pedagógica precoce." },
    ],
    maintenanceFeatures: ["Suporte durante período letivo", "Backup de dados acadêmicos", "Atualizações de conteúdo", "Monitoramento de performance"],
    scopeLabels: { landing: "Portal Institucional", user: "Área do Aluno", admin: "Painel Pedagógico" },
    investmentJustification: "Segundo a UNESCO (2023), instituições com plataformas digitais integradas aumentam a retenção de alunos em até 40%.",
    expertReference: "Ref: UNESCO - Digital Education Report (2023); EdTech Magazine - LMS Impact Study (2024)",
  },
  ecommerce: {
    kpis: [
      { icon: "🛒", label: "Conversão", metric: "+25%" },
      { icon: "💰", label: "Ticket Médio", metric: "+18%" },
      { icon: "🔄", label: "Recompra", metric: "+40%" },
      { icon: "📦", label: "Eficiência Logística", metric: "+35%" },
    ],
    risks: [
      { title: "Segurança de Pagamentos", impact: "Fraude e chargebacks", mitigation: "PCI-DSS + gateway certificado + 3D Secure", severity: "alto" },
      { title: "Performance sob Carga", impact: "Perda de vendas em picos", mitigation: "CDN + cache agressivo + auto-scaling", severity: "alto" },
      { title: "Integração com ERPs", impact: "Estoque desatualizado", mitigation: "Webhooks em tempo real + reconciliação", severity: "medio" },
    ],
    strategicBenefits: [
      { title: "Omnicanalidade", desc: "Estratégia omnichannel aumenta receita em 30% (Salesforce, 2024)." },
      { title: "Personalização com IA", desc: "Recomendações personalizadas elevam conversão em 26% (McKinsey, 2023)." },
      { title: "Logística Inteligente", desc: "Automação de fulfillment reduz custos em 20%." },
    ],
    maintenanceFeatures: ["Monitoramento de uptime 24/7", "Otimização de SEO contínua", "Segurança PCI-DSS", "Análise de funil de conversão"],
    scopeLabels: { landing: "Loja Online", user: "Minha Conta", admin: "Painel de Vendas" },
    investmentJustification: "Segundo a Shopify (2024), e-commerces com experiência personalizada têm 3x mais retenção de clientes.",
    expertReference: "Ref: McKinsey - Future of E-Commerce (2023); Salesforce - State of Commerce Report (2024)",
  },
  financeiro: {
    kpis: [
      { icon: "📊", label: "Precisão de Dados", metric: "99.9%" },
      { icon: "⏱", label: "Tempo de Fechamento", metric: "-60%" },
      { icon: "🔒", label: "Conformidade", metric: "100%" },
      { icon: "💹", label: "ROI do Sistema", metric: "3.5x" },
    ],
    risks: [
      { title: "Conformidade Regulatória", impact: "Penalidades do Banco Central", mitigation: "Auditoria contínua + consultoria jurídica", severity: "alto" },
      { title: "Segurança de Dados Financeiros", impact: "Vazamento de informações sensíveis", mitigation: "Criptografia AES-256 + SOC2 compliance", severity: "alto" },
      { title: "Indisponibilidade", impact: "Perda financeira direta", mitigation: "Redundância multi-região + DR automático", severity: "alto" },
    ],
    strategicBenefits: [
      { title: "Automação Contábil", desc: "Redução de 70% em erros manuais (PwC, 2024)." },
      { title: "Compliance Automatizado", desc: "Monitoramento regulatório em tempo real com alertas automáticos." },
      { title: "Business Intelligence", desc: "Dashboards executivos para decisões baseadas em dados." },
    ],
    maintenanceFeatures: ["Monitoramento de segurança 24/7", "Backup com retenção de 7 anos", "Atualizações regulatórias", "Auditoria de logs trimestral"],
    scopeLabels: { landing: "Portal Institucional", user: "Área do Cliente", admin: "Painel Financeiro" },
    investmentJustification: "Segundo a PwC (2024), fintechs com sistemas integrados reduzem custos operacionais em até 45%.",
    expertReference: "Ref: PwC - Future of Financial Services (2024); Deloitte - Banking Technology Outlook (2023)",
  },
  imobiliario: {
    kpis: [
      { icon: "🏠", label: "Leads Qualificados", metric: "+50%" },
      { icon: "⏱", label: "Tempo de Venda", metric: "-30%" },
      { icon: "📊", label: "Conversão de Visitas", metric: "+40%" },
      { icon: "⭐", label: "Satisfação", metric: "92+" },
    ],
    risks: [
      { title: "Integração com Portais", impact: "Listagens desatualizadas", mitigation: "API com ZAP/OLX + sincronização automática", severity: "medio" },
      { title: "Performance de Imagens", impact: "Carregamento lento", mitigation: "CDN + otimização WebP + lazy loading", severity: "medio" },
      { title: "Gestão de Leads", impact: "Perda de oportunidades", mitigation: "CRM integrado + autoresponder", severity: "alto" },
    ],
    strategicBenefits: [
      { title: "Tour Virtual 360°", desc: "Imóveis com tour virtual vendem 31% mais rápido (NAR, 2023)." },
      { title: "CRM Imobiliário", desc: "Gestão de pipeline aumenta conversão em 40% (Redfin, 2024)." },
      { title: "Marketing Automatizado", desc: "Campanhas segmentadas por perfil de comprador." },
    ],
    maintenanceFeatures: ["Sincronização com portais", "Otimização de fotos automática", "Relatórios de performance", "Suporte para corretores"],
    scopeLabels: { landing: "Vitrine de Imóveis", user: "Área do Cliente", admin: "Painel da Imobiliária" },
    investmentJustification: "Segundo a NAR (2023), 97% dos compradores buscam imóveis online antes da visita presencial.",
    expertReference: "Ref: National Association of Realtors (2023); Zillow - Digital Real Estate Report (2024)",
  },
  coworking: {
    kpis: [
      { icon: "🏢", label: "Taxa de Ocupação", metric: "+40%" },
      { icon: "⏱", label: "Tempo de Gestão", metric: "-55%" },
      { icon: "🔄", label: "Renovação de Planos", metric: "+35%" },
      { icon: "⭐", label: "NPS Esperado", metric: "88+" },
    ],
    risks: [
      { title: "Conflitos de Agendamento", impact: "Insatisfação de membros", mitigation: "Verificação automática de conflitos em tempo real", severity: "medio" },
      { title: "Controle de Acesso", impact: "Uso não autorizado", mitigation: "Integração com fechaduras inteligentes + QR Code", severity: "medio" },
      { title: "Escalabilidade Multi-Unidade", impact: "Gestão descentralizada", mitigation: "Arquitetura multi-tenant desde o início", severity: "baixo" },
    ],
    strategicBenefits: [
      { title: "Automação de Reservas", desc: "Redução de 60% no tempo administrativo (Deskmag, 2024)." },
      { title: "Comunidade Digital", desc: "Networking entre membros aumenta retenção em 30%." },
      { title: "Analytics de Espaço", desc: "Dados de uso para otimizar layout e precificação dinâmica." },
    ],
    maintenanceFeatures: ["Monitoramento de agendamentos", "Suporte para novas salas/espaços", "Relatórios de ocupação mensal", "Integração com sistemas de acesso"],
    scopeLabels: { landing: "Landing Page", user: "Painel do Membro", admin: "Painel Administrativo" },
    investmentJustification: "Segundo a Deskmag (2024), coworkings com gestão digital têm 45% maior taxa de ocupação.",
    expertReference: "Ref: Deskmag - Global Coworking Survey (2024); WeWork - Workspace Technology Report (2023)",
  },
  restaurante: {
    kpis: [
      { icon: "🍽", label: "Pedidos Online", metric: "+60%" },
      { icon: "⏱", label: "Tempo de Atendimento", metric: "-35%" },
      { icon: "💰", label: "Ticket Médio", metric: "+20%" },
      { icon: "⭐", label: "Avaliação", metric: "4.8+" },
    ],
    risks: [
      { title: "Integração com Delivery", impact: "Pedidos perdidos", mitigation: "API com iFood/Rappi + webhook em tempo real", severity: "alto" },
      { title: "Gestão de Estoque", impact: "Itens indisponíveis", mitigation: "Controle automático com alertas de baixa", severity: "medio" },
      { title: "Picos de Demanda", impact: "Sistema lento", mitigation: "Cache agressivo + CDN + auto-scaling", severity: "medio" },
    ],
    strategicBenefits: [
      { title: "Cardápio Digital", desc: "Menus digitais aumentam vendas em 30% (NRA, 2024)." },
      { title: "Fidelização", desc: "Programas digitais de fidelidade elevam recompra em 40%." },
      { title: "Analytics Gastronômico", desc: "Dados de consumo para otimizar cardápio e compras." },
    ],
    maintenanceFeatures: ["Atualização de cardápio em tempo real", "Monitoramento de pedidos", "Relatórios de vendas diários", "Suporte para integrações"],
    scopeLabels: { landing: "Cardápio Online", user: "Área do Cliente", admin: "Painel do Restaurante" },
    investmentJustification: "Segundo a NRA (2024), restaurantes com presença digital têm 50% mais receita de delivery.",
    expertReference: "Ref: National Restaurant Association (2024); Toast - Restaurant Technology Report (2023)",
  },
};

// Keywords to detect niche from project description
const NICHE_KEYWORDS: Record<string, string[]> = {
  saude: ["clínica", "hospital", "paciente", "médico", "saúde", "consulta", "prontuário", "agendamento médico", "health", "telemedicina"],
  educacao: ["escola", "universidade", "aluno", "curso", "educação", "aprendizagem", "estudante", "aula", "lms", "ead"],
  ecommerce: ["loja", "e-commerce", "ecommerce", "produto", "venda", "carrinho", "checkout", "marketplace", "compra"],
  financeiro: ["banco", "fintech", "financeiro", "pagamento", "crédito", "investimento", "contábil", "fiscal"],
  imobiliario: ["imóvel", "imobiliária", "aluguel", "locação", "corretor", "apartamento", "propriedade"],
  coworking: ["coworking", "sala de reunião", "agendamento de sala", "espaço compartilhado", "reserva de sala", "workspace"],
  restaurante: ["restaurante", "delivery", "cardápio", "pedido", "food", "comida", "gastronomia", "bar", "cafeteria"],
};

function detectNiche(proposta: { segmento?: string | null; tipo_projeto?: string; descricao_projeto?: string }): string {
  // First check explicit segment
  const seg = (proposta.segmento || "").toLowerCase();
  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (keywords.some(k => seg.includes(k))) return niche;
  }
  // Then check description
  const desc = `${proposta.tipo_projeto || ""} ${proposta.descricao_projeto || ""}`.toLowerCase();
  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (keywords.some(k => desc.includes(k))) return niche;
  }
  return "generico";
}

const DEFAULT_PROFILE: NicheProfile = {
  segment: "Tecnologia",
  kpis: [
    { icon: "📊", label: "Eficiência Operacional", metric: "+45%" },
    { icon: "⏱", label: "Tempo de Processos", metric: "-40%" },
    { icon: "💡", label: "Automação", metric: "+60%" },
    { icon: "⭐", label: "Satisfação do Usuário", metric: "90+" },
  ],
  risks: [
    { title: "Atraso no Desenvolvimento", impact: "Prazo comprometido", mitigation: "Sprints semanais + buffer de tempo", severity: "medio" },
    { title: "Mudança de Escopo", impact: "Custos adicionais", mitigation: "Documentação aprovada no kick-off", severity: "medio" },
    { title: "Integração com Terceiros", impact: "Dados inconsistentes", mitigation: "Ambiente de staging isolado para testes", severity: "baixo" },
  ],
  strategicBenefits: [
    { title: "Automação de Processos", desc: "Empresas que automatizam processos economizam 30% em custos (Gartner, 2024)." },
    { title: "Experiência do Usuário", desc: "Interfaces intuitivas aumentam adoção em 45% (Forrester, 2023)." },
    { title: "Dados para Decisão", desc: "Dashboards executivos para tomada de decisão baseada em evidências." },
  ],
  maintenanceFeatures: ["Correções de bugs", "Pequenos ajustes visuais", "Monitoramento de servidor", "Relatórios mensais"],
  timelinePhases: [
    { title: "SEMANA 1", subtitle: "Descoberta & Design", desc: "Definição UX/UI, arquitetura do sistema e aprovação de protótipos." },
    { title: "SEMANA 2", subtitle: "Backend Core", desc: "Desenvolvimento da lógica de negócio, APIs e gestão de dados." },
    { title: "SEMANA 3", subtitle: "Frontend & Integração", desc: "Construção das interfaces, painéis e conexão com API." },
    { title: "SEMANA 4", subtitle: "Go-Live", desc: "Testes finais, homologação, treinamento e lançamento oficial." },
  ],
  scopeLabels: { landing: "Landing Page", user: "Painel de Usuários", admin: "Painel Administrativo" },
  investmentJustification: "Segundo a Gartner (2024), empresas que investem em sistemas digitais personalizados têm ROI médio de 3x no primeiro ano.",
  expertReference: "Ref: Gartner - Technology Investment Outlook (2024); Forrester - Digital Experience Report (2023)",
};

export function getNicheProfile(proposta: { segmento?: string | null; tipo_projeto?: string; descricao_projeto?: string }): NicheProfile {
  const niche = detectNiche(proposta);
  const nicheData = NICHE_PROFILES[niche];

  if (!nicheData) return { ...DEFAULT_PROFILE };

  return {
    segment: proposta.segmento || DEFAULT_PROFILE.segment,
    kpis: nicheData.kpis || DEFAULT_PROFILE.kpis,
    risks: nicheData.risks || DEFAULT_PROFILE.risks,
    strategicBenefits: nicheData.strategicBenefits || DEFAULT_PROFILE.strategicBenefits,
    maintenanceFeatures: nicheData.maintenanceFeatures || DEFAULT_PROFILE.maintenanceFeatures,
    timelinePhases: nicheData.timelinePhases || DEFAULT_PROFILE.timelinePhases,
    scopeLabels: nicheData.scopeLabels || DEFAULT_PROFILE.scopeLabels,
    investmentJustification: nicheData.investmentJustification || DEFAULT_PROFILE.investmentJustification,
    expertReference: nicheData.expertReference || DEFAULT_PROFILE.expertReference,
  };
}
