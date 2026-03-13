import { supabase } from "@/integrations/supabase/client";
import type { Proposta } from "@/lib/propostas";

export type PdfStatus = "gerado" | "enviado" | "visualizado" | "substituido" | "revogado";

export interface PdfVersao {
  id: string;
  proposta_id: string;
  nome_arquivo: string;
  storage_path: string;
  versao: number;
  criado_em: string;
  tamanho_bytes: number;
  status: PdfStatus;
  template_used: string;
  emissor_id: string | null;
  document_code: string;
  document_hash: string;
  snapshot: Record<string, any>;
}

function generateDocumentCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = [4, 4, 4];
  return segments.map(len => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("")).join("-");
}

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function buildSnapshot(proposta: Proposta, templateId: string): Record<string, any> {
  return {
    nome_cliente: proposta.nome_cliente,
    empresa_cliente: proposta.empresa_cliente,
    segmento: proposta.segmento,
    email_cliente: proposta.email_cliente,
    tipo_projeto: proposta.tipo_projeto,
    descricao_projeto: proposta.descricao_projeto,
    proposta_json: proposta.proposta_json,
    valor_minimo: proposta.valor_minimo,
    valor_ideal: proposta.valor_ideal,
    valor_premium: proposta.valor_premium,
    complexidade: proposta.complexidade,
    classificacao_margem: proposta.classificacao_margem,
    proposal_tiers: proposta.proposal_tiers,
    proposal_addons: proposta.proposal_addons,
    recommended_tier: proposta.recommended_tier,
    commercial_notes: proposta.commercial_notes,
    proposal_validity: proposta.proposal_validity,
    is_phased: proposta.is_phased,
    template_used: templateId,
    emitted_at: new Date().toISOString(),
  };
}

export async function uploadPdf(
  propostaId: string,
  nomeCliente: string,
  pdfBlob: Blob,
  proposta?: Proposta,
  templateId?: string,
): Promise<PdfVersao> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get next version number
  const { data: existing } = await supabase
    .from("pdf_versoes" as any)
    .select("versao")
    .eq("proposta_id", propostaId)
    .order("versao", { ascending: false })
    .limit(1);

  const nextVersion = ((existing as any[])?.[0]?.versao || 0) + 1;

  // Mark previous versions as substituted
  if (nextVersion > 1) {
    await supabase
      .from("pdf_versoes" as any)
      .update({ status: "substituido" } as any)
      .eq("proposta_id", propostaId)
      .eq("status", "gerado");
  }

  const clientSlug = nomeCliente.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `Proposta_HolyNex_${clientSlug}_v${nextVersion}_${timestamp}.pdf`;
  const storagePath = `${propostaId}/${fileName}`;

  // Generate document code and hash
  const documentCode = generateDocumentCode();
  const snapshot = proposta ? buildSnapshot(proposta, templateId || "default") : {};
  const documentHash = await generateHash(JSON.stringify(snapshot) + documentCode + timestamp);

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("propostas-pdf")
    .upload(storagePath, pdfBlob, { contentType: "application/pdf", upsert: false });

  if (uploadError) throw uploadError;

  // Save version record
  const { data, error } = await supabase
    .from("pdf_versoes" as any)
    .insert({
      proposta_id: propostaId,
      nome_arquivo: fileName,
      storage_path: storagePath,
      versao: nextVersion,
      tamanho_bytes: pdfBlob.size,
      status: "gerado",
      template_used: templateId || "default",
      emissor_id: user?.id || null,
      document_code: documentCode,
      document_hash: documentHash,
      snapshot: JSON.stringify(snapshot),
    } as any)
    .select("*")
    .single();

  if (error) throw error;

  const row = data as any;
  return {
    ...row,
    snapshot: typeof row.snapshot === "string" ? JSON.parse(row.snapshot) : (row.snapshot || {}),
  } as PdfVersao;
}

export async function getPdfVersoes(propostaId: string): Promise<PdfVersao[]> {
  const { data, error } = await supabase
    .from("pdf_versoes" as any)
    .select("*")
    .eq("proposta_id", propostaId)
    .order("versao", { ascending: false });

  if (error) throw error;
  return ((data as any[]) || []).map(row => ({
    ...row,
    snapshot: typeof row.snapshot === "string" ? JSON.parse(row.snapshot) : (row.snapshot || {}),
  })) as PdfVersao[];
}

export function getPdfDownloadUrl(storagePath: string): string {
  const { data } = supabase.storage.from("propostas-pdf").getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function deletePdfVersao(id: string, storagePath: string) {
  await supabase.storage.from("propostas-pdf").remove([storagePath]);
  const { error } = await supabase
    .from("pdf_versoes" as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function updatePdfStatus(id: string, status: PdfStatus) {
  const { error } = await supabase
    .from("pdf_versoes" as any)
    .update({ status } as any)
    .eq("id", id);
  if (error) throw error;
}
