/**
 * Event tracking for proposal AI generation and PDF rendering pipeline.
 * Logs events to audit_logs for observability.
 */

import { supabase } from "@/integrations/supabase/client";

export type ProposalEventType =
  | "proposal_ai_requested"
  | "proposal_ai_completed"
  | "proposal_ai_failed"
  | "proposal_pdf_render_started"
  | "proposal_pdf_render_failed"
  | "proposal_pdf_generated";

export interface ProposalEventMeta {
  provider_used?: string;
  model_used?: string;
  prompt_version?: string;
  schema_valid?: boolean;
  structured_schema_valid?: boolean;
  output_size?: number;
  render_status?: string;
  render_error?: string;
  pdf_version?: number;
  template_id?: string;
  warnings?: string[];
  structured_warnings?: string[];
  duration_ms?: number;
  niche_detected?: string;
  pipeline_steps?: string[];
  pages?: number;
}

export async function logProposalEvent(
  event: ProposalEventType,
  entityId: string,
  meta: ProposalEventMeta = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      action: event,
      entity_type: "proposta",
      entity_id: entityId,
      user_id: user?.id || null,
      user_email: user?.email || "",
      details: meta as any,
    });
  } catch (err) {
    console.error(`[ProposalEvent] Failed to log ${event}:`, err);
  }
}
