import { describe, expect, it } from "vitest";
import { prospectToLeadImport, type LeadProspect } from "@/lib/lead-prospecting";

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
});
