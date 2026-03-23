import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_BOOTSTRAP_EMAILS = ["admin@holynexlabs.com.br"];

const MODULES = [
  "dashboard", "leads", "propostas", "projetos", "sistemas",
  "acessos", "modulos", "manutencao", "portfolio", "modelos",
  "financeiro", "ia", "seguranca", "configuracoes", "addons", "brand_studio",
];

const ACTIONS = [
  "visualizar", "criar", "editar", "excluir", "exportar",
  "gerar_pdf", "baixar_pdf", "aprovar", "visualizar_segredo", "revogar_documento",
  "alterar_permissoes", "acessar_financeiro", "acessar_seguranca",
  "gerenciar_configuracoes", "ativar_addon", "gerenciar_provedores_ia",
  "revisar_blueprint", "acessar_avancado",
  "view_brand_project", "create_brand_project", "edit_brand_project",
  "run_brand_agent", "approve_brand_asset", "generate_brand_pdf",
  "manage_brand_agents", "activate_brand_addon",
];

function parseEmailList(raw: string | undefined) {
  if (!raw) return DEFAULT_BOOTSTRAP_EMAILS;
  const parsed = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_BOOTSTRAP_EMAILS;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: "Supabase nao configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuario nao autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = (user.email || "").toLowerCase();
    const allowlist = parseEmailList(Deno.env.get("ADMIN_BOOTSTRAP_EMAILS"));
    if (!allowlist.includes(email)) {
      return new Response(JSON.stringify({ error: "Email nao autorizado para bootstrap" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await sb
      .from("user_profiles")
      .select("id, role_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      await sb.from("user_profiles").insert({
        user_id: user.id,
        email: user.email || "",
        full_name: (user.user_metadata as any)?.full_name || "",
        role_name: "dev_admin",
      });
    } else if (profile.role_name !== "dev_admin") {
      await sb.from("user_profiles").update({ role_name: "dev_admin", atualizado_em: new Date().toISOString() }).eq("user_id", user.id);
    }

    await sb.from("user_role_assignments").upsert({
      user_id: user.id,
      role_name: "dev_admin",
      is_active: true,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "user_id,role_name" });

    await sb
      .from("user_role_assignments")
      .update({ is_active: false, atualizado_em: new Date().toISOString() })
      .eq("user_id", user.id)
      .neq("role_name", "dev_admin");

    const permissionsPayload = MODULES.flatMap((module) =>
      ACTIONS.map((action) => ({ role_name: "dev_admin", module, action, allowed: true }))
    );

    const batchSize = 200;
    for (let i = 0; i < permissionsPayload.length; i += batchSize) {
      const batch = permissionsPayload.slice(i, i + batchSize);
      await sb.from("role_permissions").upsert(batch, { onConflict: "role_name,module,action" });
    }

    return new Response(JSON.stringify({ ok: true, role: "dev_admin" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro ao aplicar bootstrap" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
