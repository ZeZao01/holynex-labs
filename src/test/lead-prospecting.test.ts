import { afterEach, describe, expect, it, vi } from "vitest";
import { prospectToLeadImport, searchLeadProspects, type LeadProspect } from "@/lib/lead-prospecting";

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: invokeMock } },
}));

const prospect: LeadProspect = {
  id: "place-12345",
  name: "Clínica Exemplo",
  segment: "Clínica",
  address: "Rua Exemplo, Campinas, SP",
  city: "Campinas",
  phone: "+55 19 99999-0000",
  website: "",
  openingHours: "",
  latitude: "-22.9",
  longitude: "-47.0",
  mapUrl: "https://maps.google.com/example",
  rating: 4.8,
  reviewCount: 183,
  businessStatus: "OPERATIONAL",
  successScore: 85,
  successLabel: "Alta",
  scoreReasons: ["não possui site cadastrado no Google", "avaliação excelente"],
  suggestedOffer: "automation",
  suggestedProject: "Site de conversão + atendimento automatizado",
  projectSummary: "Site com prova social e agendamento pelo WhatsApp.",
  readyMessage: "Olá! Preparei uma ideia para sua clínica.",
};

describe("Google Places lead prospecting", () => {
  afterEach(() => invokeMock.mockReset());

  it("converts the scored opportunity, project and ready message into a CRM lead", () => {
    const lead = prospectToLeadImport(prospect, "Clínicas e consultórios");
    expect(lead).toMatchObject({
      city: "Campinas",
      niche: "Clínicas e consultórios",
      company: "Clínica Exemplo",
      source: "google_places",
      projectType: "Automação / IA",
      email: "prospect-place-12345@sem-email.local",
    });
    expect(lead.objective).toContain("85% (Alta)");
    expect(lead.objective).toContain(prospect.readyMessage);
  });

  it("requests only no-site Google Places results with the requested limit", async () => {
    invokeMock.mockResolvedValue({
      data: { prospects: [prospect], attribution: "Google Maps Platform", totalFetched: 20, resultLimit: 60 },
      error: null,
    });
    const result = await searchLeadProspects("Campinas, SP", "Clínicas", 40);
    expect(invokeMock).toHaveBeenCalledWith("prospectar-leads", {
      body: { city: "Campinas, SP", niche: "Clínicas", limit: 40, withoutWebsite: true },
    });
    expect(result.prospects).toEqual([prospect]);
    expect(result.totalFetched).toBe(20);
  });

  it("does not hide a failed Edge Function behind unrelated map data", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { context: { status: 404 } } });
    await expect(searchLeadProspects("Santos, SP", "Imobiliárias")).rejects.toThrow("indisponível");
  });

  it("explains when the server-side Google key is missing", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { context: { status: 503 } } });
    await expect(searchLeadProspects("Santos, SP", "Imobiliárias")).rejects.toThrow("GOOGLE_MAPS_API_KEY");
  });
});
