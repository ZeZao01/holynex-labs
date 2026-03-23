import { supabase } from "@/integrations/supabase/client";
import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import type {
  BrandBrief,
  BrandBriefReference,
  BrandBriefReferenceType,
  BrandBriefingNormalizationOutput,
} from "@/types/brand-studio";

const DOMAIN = "brand-briefs";
const TABLE = "brand_briefs";
const REFERENCES_TABLE = "brand_brief_references";
const ASSETS_TABLE = "brand_design_assets";
const REFERENCE_BUCKET = "brand-references";

interface CreateBrandReferenceInput {
  project_id: string;
  brief_id?: string | null;
  reference_type: Exclude<BrandBriefReferenceType, "image">;
  source_url?: string | null;
  note?: string | null;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

interface UploadBrandReferenceImagesInput {
  projectId: string;
  briefId?: string | null;
  files: File[];
  startOrder?: number;
}

export async function listBrandBriefs(): Promise<BrandBrief[]> {
  logDomain(DOMAIN, "listBrandBriefs", "info", "Listing briefs");
  const result = await dbAny.from(TABLE).select("*").order("atualizado_em", { ascending: false });
  return (unwrap(result, DOMAIN, "listBrandBriefs") || []) as BrandBrief[];
}

export async function getBrandBriefsByProject(projectId: string): Promise<BrandBrief[]> {
  logDomain(DOMAIN, "getBrandBriefsByProject", "info", `project=${projectId}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("version", { ascending: false });
  return (unwrap(result, DOMAIN, "getBrandBriefsByProject") || []) as BrandBrief[];
}

export async function getLatestBrandBriefByProject(projectId: string): Promise<BrandBrief | null> {
  logDomain(DOMAIN, "getLatestBrandBriefByProject", "info", `project=${projectId}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .order("atualizado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (unwrap(result, DOMAIN, "getLatestBrandBriefByProject") || null) as BrandBrief | null;
}

export async function saveBrandBrief(payload: Partial<BrandBrief> & { project_id: string; titulo: string }) {
  if (payload.id) {
    logDomain(DOMAIN, "saveBrandBrief", "info", `update=${payload.id}`);
    const result = await dbAny
      .from(TABLE)
      .update(payload)
      .eq("id", payload.id)
      .select("*")
      .single();
    return unwrap(result, DOMAIN, "saveBrandBrief.update") as BrandBrief;
  }

  const latest = await getLatestBrandBriefByProject(payload.project_id);
  const version = latest ? Math.max((latest.version || 1) + 1, 1) : 1;

  logDomain(DOMAIN, "saveBrandBrief", "info", `create.project=${payload.project_id}`);
  const result = await dbAny
    .from(TABLE)
    .insert({ ...payload, version })
    .select("*")
    .single();
  return unwrap(result, DOMAIN, "saveBrandBrief.create") as BrandBrief;
}

export async function saveOrUpdateLatestBrandBrief(
  projectId: string,
  payload: Partial<BrandBrief> & { titulo: string }
): Promise<BrandBrief> {
  const latest = await getLatestBrandBriefByProject(projectId);
  if (latest?.id) {
    return saveBrandBrief({ ...payload, id: latest.id, project_id: projectId });
  }
  return saveBrandBrief({ ...payload, project_id: projectId });
}

export async function applyBrandBriefingNormalization(
  briefId: string,
  output: BrandBriefingNormalizationOutput
): Promise<BrandBrief> {
  logDomain(DOMAIN, "applyBrandBriefingNormalization", "info", `brief=${briefId};status=${output.status}`);
  const result = await dbAny
    .from(TABLE)
    .update({
      normalized_context: output.normalized_context,
      missing_questions: output.missing_questions,
      readiness_score: output.readiness_score,
      gap_summary: output.gap_summary || null,
      normalized_at: new Date().toISOString(),
      status: output.status,
    })
    .eq("id", briefId)
    .select("*")
    .single();
  return unwrap(result, DOMAIN, "applyBrandBriefingNormalization") as BrandBrief;
}

export async function listBrandBriefReferencesByProject(projectId: string): Promise<BrandBriefReference[]> {
  logDomain(DOMAIN, "listBrandBriefReferencesByProject", "info", `project=${projectId}`);
  const result = await dbAny
    .from(REFERENCES_TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("criado_em", { ascending: true });
  return (unwrap(result, DOMAIN, "listBrandBriefReferencesByProject") || []) as BrandBriefReference[];
}

export async function listBrandBriefReferencesByBrief(briefId: string): Promise<BrandBriefReference[]> {
  logDomain(DOMAIN, "listBrandBriefReferencesByBrief", "info", `brief=${briefId}`);
  const result = await dbAny
    .from(REFERENCES_TABLE)
    .select("*")
    .eq("brief_id", briefId)
    .order("sort_order", { ascending: true })
    .order("criado_em", { ascending: true });
  return (unwrap(result, DOMAIN, "listBrandBriefReferencesByBrief") || []) as BrandBriefReference[];
}

export async function createBrandBriefReferences(inputs: CreateBrandReferenceInput[]): Promise<BrandBriefReference[]> {
  if (inputs.length === 0) return [];
  logDomain(DOMAIN, "createBrandBriefReferences", "info", `count=${inputs.length}`);

  const payload = inputs.map((item, idx) => ({
    project_id: item.project_id,
    brief_id: item.brief_id || null,
    reference_type: item.reference_type,
    source_url: item.reference_type === "url" ? item.source_url || null : null,
    note: item.reference_type === "note" ? item.note || null : null,
    sort_order: item.sort_order ?? idx,
    metadata: item.metadata || {},
  }));

  const result = await dbAny.from(REFERENCES_TABLE).insert(payload).select("*");
  return (unwrap(result, DOMAIN, "createBrandBriefReferences") || []) as BrandBriefReference[];
}

export async function uploadBrandBriefReferenceImages({
  projectId,
  briefId = null,
  files,
  startOrder = 0,
}: UploadBrandReferenceImagesInput): Promise<BrandBriefReference[]> {
  if (!files.length) return [];

  logDomain(DOMAIN, "uploadBrandBriefReferenceImages", "info", `project=${projectId};count=${files.length}`);

  const uploads = files.map(async (file, index) => {
    const extension = file.name.split(".").pop() || "bin";
    const storagePath = `${projectId}/${briefId || "sem-brief"}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(REFERENCE_BUCKET)
      .upload(storagePath, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(REFERENCE_BUCKET).getPublicUrl(storagePath);

    const referencePayload = {
      project_id: projectId,
      brief_id: briefId,
      reference_type: "image",
      bucket: REFERENCE_BUCKET,
      storage_path: storagePath,
      public_url: publicData.publicUrl,
      source_url: null,
      note: null,
      original_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size || null,
      sort_order: startOrder + index,
      metadata: {},
    };

    const insertedReference = await dbAny
      .from(REFERENCES_TABLE)
      .insert(referencePayload)
      .select("*")
      .single();

    const reference = unwrap(insertedReference, DOMAIN, "uploadBrandBriefReferenceImages.insertReference") as BrandBriefReference;

    const assetPayload = {
      project_id: projectId,
      bucket: REFERENCE_BUCKET,
      storage_path: storagePath,
      public_url: publicData.publicUrl,
      asset_type: "image",
      mime_type: file.type || null,
      size_bytes: file.size || null,
      metadata: { source: "brand_brief_reference", reference_id: reference.id },
    };

    const assetInsert = await dbAny.from(ASSETS_TABLE).insert(assetPayload);
    if (assetInsert.error) {
      logDomain(DOMAIN, "uploadBrandBriefReferenceImages.assetWarning", "warn", assetInsert.error.message);
    }

    return reference;
  });

  return Promise.all(uploads);
}

export async function deleteBrandBriefReference(referenceId: string): Promise<void> {
  logDomain(DOMAIN, "deleteBrandBriefReference", "info", `id=${referenceId}`);

  const selectResult = await dbAny
    .from(REFERENCES_TABLE)
    .select("id, bucket, storage_path")
    .eq("id", referenceId)
    .maybeSingle();
  const found = unwrap(selectResult, DOMAIN, "deleteBrandBriefReference.select") as
    | { id: string; bucket: string | null; storage_path: string | null }
    | null;

  if (found?.bucket && found.storage_path) {
    const { error: removeError } = await supabase.storage.from(found.bucket).remove([found.storage_path]);
    if (removeError) {
      logDomain(DOMAIN, "deleteBrandBriefReference.storageWarning", "warn", removeError.message);
    }
  }

  const deleteResult = await dbAny.from(REFERENCES_TABLE).delete().eq("id", referenceId);
  unwrap(deleteResult, DOMAIN, "deleteBrandBriefReference.delete");
}

export async function countBrandBriefs(): Promise<number> {
  logDomain(DOMAIN, "countBrandBriefs", "info", "Counting briefs");
  const { count, error } = await dbAny.from(TABLE).select("*", { count: "exact", head: true });
  if (error) {
    logDomain(DOMAIN, "countBrandBriefs", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
