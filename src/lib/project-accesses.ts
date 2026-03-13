import { supabase } from "@/integrations/supabase/client";

export const ACCESS_TYPES: Record<string, string> = {
  admin_principal: "Admin Principal",
  admin_operacional: "Admin Operacional",
  login_demo: "Login Demo",
  url_publica: "URL Pública",
  staging: "Staging",
  repositorio: "Repositório",
  documentacao: "Documentação",
  analytics: "Analytics",
  banco_dados: "Banco de Dados",
  storage: "Storage",
  hospedagem: "Hospedagem",
  dominio_dns: "Domínio/DNS",
  integracao_externa: "Integração Externa",
  painel_pagamentos: "Painel de Pagamentos",
  email_transacional: "E-mail Transacional",
  automacao: "Automação",
  suporte_externo: "Suporte Externo",
};

export const ENVIRONMENTS: Record<string, string> = {
  producao: "Produção",
  staging: "Staging",
  desenvolvimento: "Desenvolvimento",
  homologacao: "Homologação",
  interno: "Interno",
  demo: "Demo",
};

export const ACCESS_STATUS: Record<string, { label: string; badge: string }> = {
  ativo: { label: "Ativo", badge: "active" },
  pendente_configuracao: { label: "Pendente Config.", badge: "pending" },
  precisa_revisao: { label: "Precisa Revisão", badge: "warm" },
  invalido: { label: "Inválido", badge: "cancelled" },
  arquivado: { label: "Arquivado", badge: "paused" },
};

export interface ProjectAccess {
  id: string;
  project_id: string | null;
  delivered_system_id: string | null;
  access_type: string;
  friendly_name: string;
  environment: string;
  provider_name: string;
  access_url: string;
  username: string;
  secret_masked: string;
  secret_reference: string;
  status: string;
  notes: string;
  owner_name: string;
  last_verified_at: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface AccessEvent {
  id: string;
  access_id: string;
  evento: string;
  descricao: string;
  criado_em: string;
}

export async function getProjectAccesses() {
  const { data, error } = await supabase
    .from("project_accesses")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data as ProjectAccess[];
}

export async function getProjectAccess(id: string) {
  const { data, error } = await supabase
    .from("project_accesses")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as ProjectAccess;
}

export async function saveProjectAccess(access: Partial<ProjectAccess>) {
  if (access.id) {
    const { data, error } = await supabase
      .from("project_accesses")
      .update({ ...access, atualizado_em: new Date().toISOString() })
      .eq("id", access.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("project_accesses")
      .insert([access as any])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteProjectAccess(id: string) {
  const { error } = await supabase.from("project_accesses").delete().eq("id", id);
  if (error) throw error;
}

export async function getAccessEvents(accessId: string) {
  const { data, error } = await supabase
    .from("project_access_events")
    .select("*")
    .eq("access_id", accessId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data as AccessEvent[];
}

export async function addAccessEvent(accessId: string, evento: string, descricao = "") {
  const { error } = await supabase
    .from("project_access_events")
    .insert({ access_id: accessId, evento, descricao });
  if (error) throw error;
}

export function maskSecret(secret: string): string {
  if (!secret) return "—";
  if (secret.length <= 4) return "••••";
  return "••••••••" + secret.slice(-4);
}

export function getAccessAlerts(accesses: ProjectAccess[]) {
  const alerts: { type: string; message: string; severity: "warning" | "error" }[] = [];
  accesses.forEach((a) => {
    if (!a.access_url) alerts.push({ type: "sem_url", message: `"${a.friendly_name}" sem URL configurada`, severity: "warning" });
    if (!a.owner_name) alerts.push({ type: "sem_responsavel", message: `"${a.friendly_name}" sem responsável definido`, severity: "warning" });
    if (a.status === "invalido") alerts.push({ type: "invalido", message: `"${a.friendly_name}" marcado como inválido`, severity: "error" });
    if (a.access_type !== "url_publica" && !a.secret_masked && !a.secret_reference) {
      alerts.push({ type: "sem_segredo", message: `"${a.friendly_name}" sem segredo configurado`, severity: "warning" });
    }
    if (a.last_verified_at) {
      const days = Math.floor((Date.now() - new Date(a.last_verified_at).getTime()) / 86400000);
      if (days > 30) alerts.push({ type: "sem_verificacao", message: `"${a.friendly_name}" sem verificação há ${days} dias`, severity: "warning" });
    } else if (a.status === "ativo") {
      alerts.push({ type: "nunca_verificado", message: `"${a.friendly_name}" nunca foi verificado`, severity: "warning" });
    }
  });
  return alerts;
}
