import { supabase } from "@/integrations/supabase/client";

export interface PdfVersao {
  id: string;
  proposta_id: string;
  nome_arquivo: string;
  storage_path: string;
  versao: number;
  criado_em: string;
  tamanho_bytes: number;
}

export async function uploadPdf(
  propostaId: string,
  nomeCliente: string,
  pdfBlob: Blob
): Promise<PdfVersao> {
  // Get next version number
  const { data: existing } = await supabase
    .from("pdf_versoes" as any)
    .select("versao")
    .eq("proposta_id", propostaId)
    .order("versao", { ascending: false })
    .limit(1);

  const nextVersion = ((existing as any[])?.[0]?.versao || 0) + 1;
  const clientSlug = nomeCliente.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `Proposta_HolyNex_${clientSlug}_v${nextVersion}_${timestamp}.pdf`;
  const storagePath = `${propostaId}/${fileName}`;

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
    } as any)
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as PdfVersao;
}

export async function getPdfVersoes(propostaId: string): Promise<PdfVersao[]> {
  const { data, error } = await supabase
    .from("pdf_versoes" as any)
    .select("*")
    .eq("proposta_id", propostaId)
    .order("versao", { ascending: false });

  if (error) throw error;
  return (data as unknown as PdfVersao[]) || [];
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
