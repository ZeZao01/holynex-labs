import { supabase } from "@/integrations/supabase/client";
import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import { createBrandAiRun } from "@/services/brand-agents";
import { saveBrandBrief } from "@/services/brand-briefs";
import type {
  BrandBrief,
  BrandBriefReference,
  BrandBriefingNormalizationOutput,
} from "@/types/brand-studio";

const DOMAIN = "brand-briefing";
const REFERENCES_TABLE = "brand_brief_references";
const REFERENCES_BUCKET = "brand-references";

const parseMultiline = (input: string | null | undefined) =>
  (input || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeStringList = (value: string[] | null | undefined) =>
  (value || []).map((item) => item.trim()).filter(Boolean);

const roundScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const requiredChecks: Array<{
  key: string;
  question: string;
  isFilled: (brief: Partial<BrandBrief>, references: BrandBriefReference[]) => boolean;
}> = [
  {
    key: "nome_marca",
    question: "Qual e o nome oficial da marca?",
    isFilled: (brief) => Boolean(brief.nome_marca?.trim()),
  },
  {
    key: "nicho",
    question: "Qual e o nicho principal da marca?",
    isFilled: (brief) => Boolean(brief.nicho?.trim()),
  },
  {
    key: "publico_alvo_detalhado",
    question: "Quem e o publico-alvo principal e secundario?",
    isFilled: (brief) => Boolean(brief.publico_alvo_detalhado?.trim()),
  },
  {
    key: "proposta_valor",
    question: "Qual e a proposta de valor que diferencia a marca?",
    isFilled: (brief) => Boolean(brief.proposta_valor?.trim()),
  },
  {
    key: "concorrentes",
    question: "Quais concorrentes devem ser considerados no contexto da marca?",
    isFilled: (brief) => normalizeStringList(brief.concorrentes).length > 0,
  },
  {
    key: "estilos_desejados",
    question: "Quais estilos visuais sao desejados para a identidade?",
    isFilled: (brief) => normalizeStringList(brief.estilos_desejados).length > 0,
  },
  {
    key: "estilos_evitar",
    question: "Quais estilos precisam ser evitados?",
    isFilled: (brief) => normalizeStringList(brief.estilos_evitar).length > 0,
  },
  {
    key: "objetivos_identidade",
    question: "Quais objetivos da identidade precisam ser atingidos?",
    isFilled: (brief) => normalizeStringList(brief.objetivos_identidade).length > 0,
  },
  {
    key: "references",
    question: "Pode anexar imagens, URLs ou notas para guiar as referencias visuais?",
    isFilled: (_brief, references) => references.length > 0,
  },
];

export function computeBrandBriefingNormalization(
  brief: Partial<BrandBrief>,
  references: BrandBriefReference[],
): BrandBriefingNormalizationOutput {
  const imageRefs = references.filter((ref) => ref.reference_type === "image");
  const urlRefs = references.filter((ref) => ref.reference_type === "url");
  const noteRefs = references.filter((ref) => ref.reference_type === "note");

  const missingQuestions = requiredChecks
    .filter((check) => !check.isFilled(brief, references))
    .map((check) => check.question);

  const scorePerItem = 100 / requiredChecks.length;
  const score = roundScore((requiredChecks.length - missingQuestions.length) * scorePerItem);

  const normalizedContext = {
    brand: {
      nome: brief.nome_marca?.trim() || "",
      slogan: brief.slogan?.trim() || "",
      nicho: brief.nicho?.trim() || "",
    },
    publico: {
      descricao: brief.publico_alvo_detalhado?.trim() || brief.publico_alvo?.trim() || "",
    },
    estrategia: {
      proposta_valor: brief.proposta_valor?.trim() || "",
      concorrentes: normalizeStringList(brief.concorrentes),
      objetivos_identidade: normalizeStringList(brief.objetivos_identidade),
    },
    direcao_visual: {
      estilos_desejados: normalizeStringList(brief.estilos_desejados),
      estilos_evitar: normalizeStringList(brief.estilos_evitar),
      contexto_referencia_visual: brief.referencia_visual_contexto?.trim() || "",
    },
    referencias: {
      total: references.length,
      imagens: imageRefs.map((ref) => ref.signed_url || ref.source_url || ref.storage_path).filter(Boolean),
      urls: urlRefs.map((ref) => ref.source_url).filter(Boolean),
      notas: noteRefs.map((ref) => ref.note).filter(Boolean),
    },
    observacoes_adicionais: brief.observacoes_adicionais?.trim() || "",
  } as Record<string, unknown>;

  return {
    normalized_context: normalizedContext,
    missing_questions: missingQuestions,
    readiness_score: score,
    gap_summary:
      missingQuestions.length > 0
        ? `Lacunas identificadas: ${missingQuestions.slice(0, 3).join(" | ")}${missingQuestions.length > 3 ? " | ..." : ""}`
        : "Briefing completo para iniciar as fases de criacao.",
    status: missingQuestions.length === 0 ? "pronto" : "incompleto",
  };
}

export async function listBrandBriefReferencesByProject(projectId: string): Promise<BrandBriefReference[]> {
  logDomain(DOMAIN, "listBrandBriefReferencesByProject", "info", `project=${projectId}`);
  const result = await dbAny
    .from(REFERENCES_TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("criado_em", { ascending: true });

  const rows = (unwrap(result, DOMAIN, "listBrandBriefReferencesByProject") || []) as BrandBriefReference[];

  const withPreview = await Promise.all(
    rows.map(async (ref) => {
      if (ref.reference_type === "image" && ref.bucket && ref.storage_path) {
        const { data } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.storage_path, 60 * 60);
        return { ...ref, signed_url: data?.signedUrl || null };
      }
      return { ...ref, signed_url: ref.source_url || null };
    }),
  );

  return withPreview;
}

export async function createBrandBriefReference(
  payload: Partial<BrandBriefReference> & {
    project_id: string;
    reference_type: BrandBriefReference["reference_type"];
  },
): Promise<BrandBriefReference> {
  logDomain(DOMAIN, "createBrandBriefReference", "info", payload.reference_type);
  const result = await dbAny.from(REFERENCES_TABLE).insert(payload).select("*").single();
  return unwrap(result, DOMAIN, "createBrandBriefReference") as BrandBriefReference;
}

export async function deleteBrandBriefReference(referenceId: string): Promise<void> {
  logDomain(DOMAIN, "deleteBrandBriefReference", "info", referenceId);
  const result = await dbAny.from(REFERENCES_TABLE).delete().eq("id", referenceId);
  unwrap(result, DOMAIN, "deleteBrandBriefReference");
}

export async function deleteBrandBriefReferenceWithStorage(reference: BrandBriefReference): Promise<void> {
  if (reference.reference_type === "image" && reference.bucket && reference.storage_path) {
    const { error } = await supabase.storage.from(reference.bucket).remove([reference.storage_path]);
    if (error) {
      logDomain(DOMAIN, "deleteBrandBriefReferenceWithStorage", "warn", error.message);
    }
  }

  await deleteBrandBriefReference(reference.id);
}

export async function uploadBrandBriefReferenceImage(payload: {
  project_id: string;
  brief_id?: string | null;
  file: File;
  note?: string;
  sort_order?: number;
}): Promise<BrandBriefReference> {
  const safeName = payload.file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const storagePath = `${payload.project_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  logDomain(DOMAIN, "uploadBrandBriefReferenceImage", "info", storagePath);
  const { error: uploadError } = await supabase.storage.from(REFERENCES_BUCKET).upload(storagePath, payload.file, {
    cacheControl: "3600",
    upsert: false,
    contentType: payload.file.type || "application/octet-stream",
  });

  if (uploadError) {
    logDomain(DOMAIN, "uploadBrandBriefReferenceImage", "error", uploadError.message);
    throw new Error(uploadError.message);
  }

  const inserted = await createBrandBriefReference({
    project_id: payload.project_id,
    brief_id: payload.brief_id || null,
    reference_type: "image",
    bucket: REFERENCES_BUCKET,
    storage_path: storagePath,
    public_url: null,
    source_url: null,
    note: payload.note || null,
    original_name: payload.file.name,
    mime_type: payload.file.type || null,
    size_bytes: payload.file.size,
    sort_order: payload.sort_order || 0,
    metadata: {
      original_name: payload.file.name,
      mime_type: payload.file.type || null,
      size_bytes: payload.file.size,
    },
  });

  const { data } = await supabase.storage.from(REFERENCES_BUCKET).createSignedUrl(storagePath, 60 * 60);
  return { ...inserted, signed_url: data?.signedUrl || null };
}

export async function runBrandBriefingAgent(payload: {
  brief: BrandBrief;
  references: BrandBriefReference[];
}) {
  const startedAt = Date.now();
  const normalization = computeBrandBriefingNormalization(payload.brief, payload.references);

  const updatedBrief = await saveBrandBrief({
    id: payload.brief.id,
    project_id: payload.brief.project_id,
    titulo: payload.brief.titulo || "Briefing inicial",
    readiness_score: normalization.readiness_score,
    missing_questions: normalization.missing_questions,
    normalized_context: normalization.normalized_context,
    normalized_at: new Date().toISOString(),
    gap_summary: normalization.gap_summary || null,
    status: normalization.status === "pronto" ? "normalizado" : "com_lacunas",
  });

  const run = await createBrandAiRun({
    project_id: payload.brief.project_id,
    status: "concluido",
    provider_used: "brand_briefing_agent",
    model_used: "heuristic-v1",
    input_payload: {
      brief_id: payload.brief.id,
      fields_present: requiredChecks
        .filter((check) => check.isFilled(payload.brief, payload.references))
        .map((check) => check.key),
      references_count: payload.references.length,
    },
    output_payload: normalization,
    duration_ms: Date.now() - startedAt,
  });

  return { brief: updatedBrief, run, output: normalization };
}

export function parseBriefingListInput(value: string) {
  return parseMultiline(value);
}
