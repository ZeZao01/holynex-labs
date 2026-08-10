export interface LeadImportRow {
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  niche: string;
  projectType: string;
  objective: string;
  address: string;
  website: string;
  instagram: string;
  source: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  rating?: number;
  reviewCount?: number;
  businessStatus?: string;
  openingHours?: string;
  prospectScore?: number;
  scoreReasons?: string[];
  suggestedOffer?: string;
  suggestedProject?: string;
  projectSummary?: string;
  readyMessage?: string;
}

function parseRow(row: string, delimiter: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    if (char === '"' && quoted && row[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

export function leadImportKey(lead: Pick<LeadImportRow, "name" | "company" | "email">): string {
  return [lead.email, lead.company, lead.name].map(normalize).filter(Boolean).join("|");
}

export function parseLeadCsv(content: string): LeadImportRow[] {
  const rows = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((row) => row.trim());
  if (rows.length < 2) return [];
  const delimiter = (rows[0].match(/;/g)?.length ?? 0) > (rows[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const headers = parseRow(rows[0], delimiter).map(normalize);
  const read = (values: string[], aliases: string[]) => {
    const index = headers.findIndex((header) => aliases.includes(header));
    return index >= 0 ? values[index]?.trim() ?? "" : "";
  };

  return rows.slice(1).map((row) => {
    const values = parseRow(row, delimiter);
    const company = read(values, ["empresa", "company", "negocio"]);
    const name = read(values, ["nome", "name", "contato", "responsavel"]) || company;
    return {
      name,
      company: company || name,
      email: read(values, ["email", "e-mail"]),
      phone: read(values, ["telefone", "phone", "whatsapp", "celular"]),
      city: read(values, ["cidade", "city", "municipio", "localidade"]),
      niche: read(values, ["nicho", "categoria", "category", "segmento"]),
      projectType: read(values, ["tipo_projeto", "tipo de projeto", "produto", "solucao"]) || "Landing page / Site institucional",
      objective: read(values, ["objetivo", "oportunidade", "observacao", "descricao"]),
      address: read(values, ["endereco", "address"]),
      website: read(values, ["site", "website", "url"]),
      instagram: read(values, ["instagram", "perfil"]),
      source: read(values, ["origem", "source", "fonte"]) || "csv",
    };
  }).filter((lead) => lead.name || lead.company);
}

export function buildLeadBriefing(lead: LeadImportRow): { description: string; details: string } {
  const description = lead.objective || `Prospectar ${lead.company || lead.name} e validar a oportunidade de ${lead.projectType.toLowerCase()}.`;
  const details = [
    lead.city && `Cidade: ${lead.city}`,
    lead.phone && `Telefone/WhatsApp: ${lead.phone}`,
    lead.address && `Endereço: ${lead.address}`,
    lead.website && `Site informado: ${lead.website}`,
    lead.instagram && `Instagram: ${lead.instagram}`,
    `Origem da captação: ${lead.source || "manual"}`,
  ].filter(Boolean).join("\n");
  return { description, details };
}
