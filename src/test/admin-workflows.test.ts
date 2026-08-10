import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("critical admin workflow wiring", () => {
  it("opens the internal capture dialog from the dashboard shortcut", () => {
    expect(read("src/pages/AdminDashboard.tsx")).toContain('/admin/orcamentos?captar=1');
    expect(read("src/pages/AdminOrcamentos.tsx")).toContain('searchParams.get("captar") !== "1"');
  });

  it("keeps prospecting visible and addressable from the fixed sidebar", () => {
    const sidebar = read("src/components/AdminSidebar.tsx");
    const leads = read("src/pages/AdminOrcamentos.tsx");
    expect(sidebar).toContain('{ title: "Prospectar leads", url: "/admin/orcamentos?captar=1"');
    expect(sidebar).toContain('new URLSearchParams(location.search).get("captar") === "1"');
    expect(leads).toContain('const openCapture = () => setSearchParams({ captar: "1" })');
    expect(leads).toContain('onOpenChange={handleCaptureOpenChange}');
  });

  it("does not mask Edge Function failures with unrelated map data", () => {
    const prospecting = read("src/lib/lead-prospecting.ts");
    expect(prospecting).not.toContain("nominatim");
    expect(prospecting).toContain("A busca Google Maps está indisponível no momento");
  });

  it("keeps the admin shell mounted and limits loading to the content area", () => {
    const app = read("src/App.tsx");
    const layout = read("src/components/AdminLayout.tsx");
    expect(app).toContain("<AdminLayout>");
    expect(app).toContain("fallback={<AdminContentLoading />}");
    expect(app).not.toContain('<LoadingOverlay active={showDataLoading} label="Carregando dados" />\n      </AdminLayout>');
    expect(layout).toContain("h-screen w-full overflow-hidden");
    expect(layout).toContain("min-h-0 flex-1 overflow-y-auto");
  });

  it("connects public proposal acceptance to a token-scoped database function", () => {
    const page = read("src/pages/PropostaPublica.tsx");
    const migration = read("supabase/migrations/20260809223000_accept_public_proposal.sql");

    expect(page).toContain("onClick={handleAccept}");
    expect(migration).toContain("FUNCTION public.accept_public_proposal(p_token text)");
    expect(migration).toContain("WHERE public_token = p_token");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.accept_public_proposal(text) TO anon, authenticated");
  });
});
