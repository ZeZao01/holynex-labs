import { afterEach, describe, expect, it, vi } from "vitest";
import { prospectToLeadImport, searchLeadProspects, type LeadProspect } from "@/lib/lead-prospecting";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: { context: { status: 404 } } }),
    },
  },
}));

const prospect: LeadProspect = {
  id: "N12345",
  name: "Clínica Exemplo",
  segment: "clinic",
  address: "Rua Exemplo, Campinas, SP",
  city: "Campinas",
  phone: "+55 19 99999-0000",
  website: "",
  instagram: "",
  openingHours: "",
  latitude: "-22.9",
  longitude: "-47.0",
  mapUrl: "https://www.openstreetmap.org/node/12345",
};

describe("lead prospect conversion", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the selected city and niche when adding a prospect to the CRM", () => {
    const lead = prospectToLeadImport(prospect, "Clínicas e consultórios");

    expect(lead.city).toBe("Campinas");
    expect(lead.niche).toBe("Clínicas e consultórios");
    expect(lead.company).toBe("Clínica Exemplo");
    expect(lead.source).toBe("openstreetmap");
    expect(lead.email).toBe("prospect-n12345@sem-email.local");
    expect(lead.objective).toContain("não possui site informado");
  });

  it("classifies prospects with a website as an automation opportunity", () => {
    const lead = prospectToLeadImport({ ...prospect, website: "https://example.com" }, "Saúde");

    expect(lead.projectType).toBe("Sistema interno");
    expect(lead.website).toBe("https://example.com");
  });

  it("uses the direct user-triggered search while the proxy is not deployed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        osm_type: "node",
        osm_id: 77,
        display_name: "Restaurante Teste, Campinas, São Paulo, Brasil",
        namedetails: { name: "Restaurante Teste" },
        address: { city: "Campinas" },
        extratags: { phone: "+55 19 3333-0000" },
        type: "restaurant",
        lat: "-22.9",
        lon: "-47.0",
      }],
    }));

    const result = await searchLeadProspects("Campinas, SP", "Restaurantes", 12);

    expect(result.prospects).toHaveLength(1);
    expect(result.prospects[0]).toMatchObject({ name: "Restaurante Teste", city: "Campinas" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
