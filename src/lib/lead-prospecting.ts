import { supabase } from "@/integrations/supabase/client";
import type { LeadImportRow } from "@/lib/lead-import";

export type ProspectOffer = "site" | "automation" | "system";

export interface LeadProspect {
  id: string;
  name: string;
  segment: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  openingHours: string;
  latitude: string;
  longitude: string;
  mapUrl: string;
  rating: number;
  reviewCount: number;
  businessStatus: string;
  successScore: number;
  successLabel: "Alta" | "Média" | "Baixa";
  scoreReasons: string[];
  suggestedOffer: ProspectOffer;
  suggestedProject: string;
  projectSummary: string;
  readyMessage: string;
}
export const PROSPECT_NICHE_GROUPS = [
  {
    label: "Saúde — odontologia",
    niches: [
      "Clínica odontológica", "Consultório odontológico", "Dentista clínico geral",
      "Ortodontista", "Implantodontista", "Endodontista", "Periodontista",
      "Odontopediatra", "Cirurgião bucomaxilofacial", "Prótese dentária",
      "Clareamento dental", "Harmonização orofacial",
    ],
  },
  {
    label: "Saúde — clínicas médicas",
    niches: [
      "Clínica médica", "Consultório médico", "Clínica de cardiologia",
      "Clínica de dermatologia", "Clínica de endocrinologia", "Clínica de ginecologia",
      "Clínica de oftalmologia", "Clínica de ortopedia", "Clínica de otorrinolaringologia",
      "Clínica de pediatria", "Clínica de neurologia", "Clínica de urologia",
      "Clínica de gastroenterologia", "Clínica de pneumologia", "Clínica de geriatria",
      "Clínica de medicina do trabalho", "Clínica popular", "Centro médico",
    ],
  },
  {
    label: "Saúde — terapias e diagnóstico",
    niches: [
      "Clínica de psicologia", "Consultório de psicologia", "Clínica de psiquiatria",
      "Clínica de fisioterapia", "Clínica de fonoaudiologia", "Clínica de terapia ocupacional",
      "Clínica de nutrição", "Consultório de nutricionista", "Clínica de quiropraxia",
      "Clínica de acupuntura", "Clínica de podologia", "Laboratório de análises clínicas",
      "Clínica de diagnóstico por imagem", "Clínica de ultrassonografia",
    ],
  },
  {
    label: "Estética e beleza",
    niches: [
      "Clínica de estética", "Clínica de estética avançada", "Clínica de depilação a laser",
      "Clínica de harmonização facial", "Clínica de emagrecimento", "Clínica capilar",
      "Centro de estética", "Salão de beleza", "Cabeleireiro", "Barbearia",
      "Manicure e pedicure", "Esmalteria", "Design de sobrancelhas", "Extensão de cílios",
      "Maquiador profissional", "Massoterapia", "Spa urbano",
    ],
  },
  {
    label: "Fitness e bem-estar",
    niches: [
      "Academia de musculação", "Academia de bairro", "Estúdio de personal trainer",
      "Estúdio de pilates", "Estúdio de yoga", "Box de crossfit", "Escola de dança",
      "Centro de treinamento funcional", "Clínica de medicina esportiva",
    ],
  },
  {
    label: "Serviços profissionais",
    niches: [
      "Escritório de advocacia", "Advogado trabalhista", "Advogado previdenciário",
      "Advogado de família", "Advogado empresarial", "Escritório de contabilidade",
      "Contador", "Consultoria empresarial", "Consultoria de RH", "Corretora de seguros",
      "Despachante", "Agência de marketing", "Agência de viagens",
    ],
  },
  {
    label: "Imóveis e construção",
    niches: [
      "Imobiliária", "Corretor de imóveis", "Administradora de condomínios",
      "Construtora", "Empresa de reformas", "Escritório de arquitetura",
      "Designer de interiores", "Engenheiro civil", "Marcenaria planejada",
      "Empresa de energia solar", "Empresa de piscinas", "Paisagismo",
    ],
  },
  {
    label: "Serviços residenciais",
    niches: [
      "Eletricista", "Encanador", "Dedetizadora", "Desentupidora", "Chaveiro",
      "Empresa de limpeza", "Limpeza de estofados", "Manutenção de ar-condicionado",
      "Assistência técnica de eletrodomésticos", "Vidraçaria", "Serralheria",
      "Mudanças e transportes", "Lavanderia",
    ],
  },
  {
    label: "Automotivo",
    niches: [
      "Oficina mecânica", "Autoelétrica", "Funilaria e pintura", "Centro automotivo",
      "Loja de pneus", "Alinhamento e balanceamento", "Estética automotiva",
      "Lava-rápido", "Insulfilm automotivo", "Oficina de motos", "Locadora de veículos",
    ],
  },
  {
    label: "Alimentação",
    niches: [
      "Restaurante", "Restaurante por quilo", "Restaurante delivery", "Pizzaria",
      "Hamburgueria", "Sushi e comida japonesa", "Churrascaria", "Marmitaria",
      "Lanchonete", "Padaria", "Confeitaria", "Cafeteria", "Açaíteria",
      "Doceria", "Buffet para eventos", "Bar e pub",
    ],
  },
  {
    label: "Pets",
    niches: [
      "Clínica veterinária", "Hospital veterinário", "Consultório veterinário",
      "Pet shop", "Banho e tosa", "Creche para cães", "Hotel para pets",
      "Adestrador de cães", "Veterinário a domicílio",
    ],
  },
  {
    label: "Educação",
    niches: [
      "Escola infantil", "Creche", "Escola particular", "Curso de idiomas",
      "Curso profissionalizante", "Reforço escolar", "Escola de música",
      "Autoescola", "Preparatório para concursos", "Professor particular",
    ],
  },
  {
    label: "Comércio especializado",
    niches: [
      "Loja de roupas femininas", "Loja de roupas masculinas", "Loja infantil",
      "Loja de calçados", "Loja de móveis", "Loja de decoração", "Ótica",
      "Joalheria", "Papelaria", "Floricultura", "Loja de suplementos",
      "Loja de materiais de construção", "Loja de celulares", "Assistência técnica de celulares",
    ],
  },
  {
    label: "Eventos e hospedagem",
    niches: [
      "Espaço para festas", "Salão de festas", "Fotógrafo", "Filmagem de eventos",
      "Cerimonialista", "Decoração de festas", "DJ para eventos", "Hotel",
      "Pousada", "Hostel", "Chácara para eventos",
    ],
  },
] as const;

export const PROSPECT_NICHES = PROSPECT_NICHE_GROUPS.flatMap((group) => group.niches);

interface FunctionErrorWithContext { context?: Response }

export async function searchLeadProspects(city: string, niche: string, limit = 60) {
  const { data, error } = await supabase.functions.invoke("prospectar-leads", {
    body: { city, niche, limit, withoutWebsite: true },
  });
  if (error) {
    const status = (error as FunctionErrorWithContext).context?.status;
    if (status === 503) throw new Error("A busca Google Maps ainda não foi configurada. Cadastre GOOGLE_MAPS_API_KEY nos secrets do Supabase.");
    throw new Error(status === 401 || status === 403 ? "Sua sessão não tem permissão para prospectar leads." : "A busca Google Maps está indisponível no momento.");
  }
  if (data?.error) throw new Error(data.error);
  return {
    prospects: (data?.prospects || []) as LeadProspect[],
    attribution: String(data?.attribution || "Google Maps Platform"),
    totalFetched: Number(data?.totalFetched || 0),
    resultLimit: Number(data?.resultLimit || 60),
  };
}

export function prospectToLeadImport(prospect: LeadProspect, niche: string): LeadImportRow {
  const safeId = prospect.id.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase() || crypto.randomUUID();
  return {
    name: prospect.name,
    company: prospect.name,
    email: `prospect-${safeId}@sem-email.local`,
    phone: prospect.phone,
    city: prospect.city,
    niche,
    projectType: prospect.suggestedOffer === "site" ? "Landing page / Site institucional" : prospect.suggestedOffer === "automation" ? "Automação / IA" : "Sistema personalizado",
    objective: `${prospect.projectSummary}\n\nProbabilidade comercial estimada: ${prospect.successScore}% (${prospect.successLabel}).\nMotivos: ${prospect.scoreReasons.join("; ")}\n\nMensagem sugerida:\n${prospect.readyMessage}`,
    address: prospect.address,
    website: prospect.website,
    instagram: "",
    source: "google_places",
  };
}
