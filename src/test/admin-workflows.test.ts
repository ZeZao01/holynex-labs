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

  it("keeps lead search available when the Edge Function cannot be reached", () => {
    expect(read("src/lib/lead-prospecting.ts")).toContain("status === undefined || status === 404");
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
