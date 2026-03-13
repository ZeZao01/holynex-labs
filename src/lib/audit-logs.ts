import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  ip_address: string;
  criado_em: string;
}

export async function getAuditLogs(limit = 100) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as AuditLog[];
}

export async function logAction(action: string, entityType: string, entityId = "", details: Record<string, any> = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({
    user_id: user?.id || null,
    user_email: user?.email || "",
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}
