/**
 * Niche-specific PDF configuration.
 * Defines color palettes, visual tone, section emphasis, and decorative
 * styles per business niche. Unknown niches get a professional fallback.
 */
import type { RGB } from "@/lib/pdf-charts";

export interface NichePdfConfig {
  /** Display name for the niche */
  label: string;
  /** Primary accent color */
  accent: RGB;
  /** Secondary accent */
  accent2: RGB;
  /** Decorative circle colors */
  decor: [RGB, RGB];
  /** Cover subtitle text */
  coverSubtitle: string;
  /** Tone description (used in footer / metadata) */
  tone: string;
  /** Sections that receive visual emphasis (larger cards, accent borders) */
  emphasisSections: string[];
  /** Default section order when pdf_blueprint is absent */
  defaultSectionsOrder: string[];
  /** Badge text for cover category */
  categoryBadge: string;
}

// ── Palettes ──
const CYAN: RGB    = [0, 180, 255];
const PURPLE: RGB  = [139, 92, 246];
const GREEN: RGB   = [34, 197, 94];
const PINK: RGB    = [236, 72, 153];
const ORANGE: RGB  = [251, 146, 60];
const YELLOW: RGB  = [250, 204, 21];
const RED: RGB     = [239, 68, 68];
const TEAL: RGB    = [20, 184, 166];
const INDIGO: RGB  = [99, 102, 241];
const LIME: RGB    = [132, 204, 22];

const BASE_SECTIONS = [
  "cover",
  "executive_summary",
  "scope",
  "investment",
  "benefits",
  "portfolio_refs",
  "tiers",
  "timeline",
  "risks",
  "closing",
];

// ── Niche Configs ──
const NICHE_CONFIGS: Record<string, NichePdfConfig> = {
  saude: {
    label: "Saúde & Bem-Estar",
    accent: TEAL,
    accent2: GREEN,
    decor: [TEAL, GREEN],
    coverSubtitle: "Solução Digital para o Setor de Saúde",
    tone: "consultivo",
    emphasisSections: ["scope", "risks", "timeline"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "HEALTH TECH",
  },
  educacao: {
    label: "Educação",
    accent: INDIGO,
    accent2: PURPLE,
    decor: [INDIGO, PURPLE],
    coverSubtitle: "Plataforma Educacional Sob Medida",
    tone: "educativo",
    emphasisSections: ["scope", "benefits", "timeline"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "ED TECH",
  },
  ecommerce: {
    label: "E-Commerce",
    accent: ORANGE,
    accent2: YELLOW,
    decor: [ORANGE, YELLOW],
    coverSubtitle: "Loja Digital & Conversão Inteligente",
    tone: "comercial",
    emphasisSections: ["investment", "benefits", "tiers"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "E-COMMERCE",
  },
  financeiro: {
    label: "Financeiro",
    accent: GREEN,
    accent2: TEAL,
    decor: [GREEN, TEAL],
    coverSubtitle: "Solução Financeira & Compliance",
    tone: "executivo",
    emphasisSections: ["investment", "risks", "scope"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "FINTECH",
  },
  logistica: {
    label: "Logística & Supply Chain",
    accent: CYAN,
    accent2: GREEN,
    decor: [CYAN, GREEN],
    coverSubtitle: "Operação Inteligente & Rastreável",
    tone: "técnico",
    emphasisSections: ["scope", "timeline", "risks"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "LOGISTICS",
  },
  juridico: {
    label: "Jurídico",
    accent: INDIGO,
    accent2: CYAN,
    decor: [INDIGO, CYAN],
    coverSubtitle: "Legal Tech & Gestão Jurídica",
    tone: "formal",
    emphasisSections: ["scope", "risks", "investment"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "LEGAL TECH",
  },
  imobiliario: {
    label: "Imobiliário",
    accent: ORANGE,
    accent2: RED,
    decor: [ORANGE, RED],
    coverSubtitle: "Prop Tech & Automação Imobiliária",
    tone: "comercial",
    emphasisSections: ["benefits", "investment", "portfolio_refs"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "PROP TECH",
  },
  alimentacao: {
    label: "Alimentação & Food Service",
    accent: RED,
    accent2: ORANGE,
    decor: [RED, ORANGE],
    coverSubtitle: "Food Tech & Gestão Operacional",
    tone: "dinâmico",
    emphasisSections: ["scope", "timeline", "benefits"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "FOOD TECH",
  },
  marketing: {
    label: "Marketing & Agências",
    accent: PINK,
    accent2: PURPLE,
    decor: [PINK, PURPLE],
    coverSubtitle: "Plataforma Criativa & Performance",
    tone: "criativo",
    emphasisSections: ["benefits", "scope", "portfolio_refs"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "MARTECH",
  },
  industria: {
    label: "Indústria & Manufatura",
    accent: CYAN,
    accent2: LIME,
    decor: [CYAN, LIME],
    coverSubtitle: "Indústria 4.0 & Automação Industrial",
    tone: "técnico",
    emphasisSections: ["scope", "timeline", "risks"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "INDUSTRY 4.0",
  },
  saas: {
    label: "SaaS & Plataformas",
    accent: PURPLE,
    accent2: CYAN,
    decor: [PURPLE, CYAN],
    coverSubtitle: "Software as a Service",
    tone: "consultivo",
    emphasisSections: ["scope", "tiers", "benefits"],
    defaultSectionsOrder: BASE_SECTIONS,
    categoryBadge: "SAAS",
  },
};

const FALLBACK_CONFIG: NichePdfConfig = {
  label: "Tecnologia",
  accent: CYAN,
  accent2: PURPLE,
  decor: [CYAN, PURPLE],
  coverSubtitle: "Desenvolvimento Sob Medida",
  tone: "consultivo",
  emphasisSections: ["scope", "investment", "benefits"],
  defaultSectionsOrder: BASE_SECTIONS,
  categoryBadge: "TECH",
};

/**
 * Normalize niche string to a config key.
 * Handles common variations, accents, and case.
 */
function normalizeNiche(niche: string): string {
  const n = niche
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // Map common variations
  const ALIASES: Record<string, string> = {
    "saude": "saude", "health": "saude", "hospital": "saude", "clinica": "saude", "medico": "saude",
    "educacao": "educacao", "escola": "educacao", "edtech": "educacao", "universidade": "educacao",
    "ecommerce": "ecommerce", "e-commerce": "ecommerce", "loja": "ecommerce", "varejo": "ecommerce", "retail": "ecommerce",
    "financeiro": "financeiro", "fintech": "financeiro", "banco": "financeiro", "contabilidade": "financeiro",
    "logistica": "logistica", "supply": "logistica", "transporte": "logistica", "frete": "logistica",
    "juridico": "juridico", "advocacia": "juridico", "legal": "juridico", "direito": "juridico",
    "imobiliario": "imobiliario", "imobiliaria": "imobiliario", "proptech": "imobiliario",
    "alimentacao": "alimentacao", "food": "alimentacao", "restaurante": "alimentacao", "delivery": "alimentacao",
    "marketing": "marketing", "agencia": "marketing", "publicidade": "marketing", "martech": "marketing",
    "industria": "industria", "manufatura": "industria", "fabrica": "industria",
    "saas": "saas", "plataforma": "saas", "software": "saas",
  };

  // Direct match
  if (ALIASES[n]) return ALIASES[n];

  // Partial match
  for (const [alias, key] of Object.entries(ALIASES)) {
    if (n.includes(alias)) return key;
  }

  return "";
}

/**
 * Resolve niche PDF config. Uses pdf_blueprint from AI when available,
 * falls back to niche detection from segmento/tipo_projeto.
 */
export function resolveNicheConfig(
  segmento?: string | null,
  tipoProj?: string | null,
  pdfBlueprint?: { tone?: string; emphasis_sections?: string[]; sections_order?: string[] } | null,
): NichePdfConfig {
  // Try to find a matching niche config
  const candidates = [segmento, tipoProj].filter(Boolean) as string[];
  let config = { ...FALLBACK_CONFIG };

  for (const candidate of candidates) {
    const key = normalizeNiche(candidate);
    if (key && NICHE_CONFIGS[key]) {
      config = { ...NICHE_CONFIGS[key] };
      break;
    }
  }

  // Override with AI-generated pdf_blueprint when available
  if (pdfBlueprint) {
    if (pdfBlueprint.tone) config.tone = pdfBlueprint.tone;
    if (Array.isArray(pdfBlueprint.emphasis_sections) && pdfBlueprint.emphasis_sections.length > 0) {
      config.emphasisSections = pdfBlueprint.emphasis_sections;
    }
    if (Array.isArray(pdfBlueprint.sections_order) && pdfBlueprint.sections_order.length >= 3) {
      config.defaultSectionsOrder = pdfBlueprint.sections_order;
    }
  }

  return config;
}

/**
 * Get the ordered list of sections to render, merging niche defaults
 * with blueprint overrides and conditional pages.
 */
export function resolveSectionsOrder(
  config: NichePdfConfig,
  hasTiers: boolean,
  hasPortfolioRefs: boolean,
): string[] {
  return config.defaultSectionsOrder.filter((section) => {
    if (section === "tiers" && !hasTiers) return false;
    if (section === "portfolio_refs" && !hasPortfolioRefs) return false;
    return true;
  });
}

/**
 * Check if a section should receive visual emphasis (larger cards, bold borders).
 */
export function isSectionEmphasized(config: NichePdfConfig, section: string): boolean {
  return config.emphasisSections.includes(section);
}
