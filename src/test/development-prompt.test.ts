import { describe, expect, it } from "vitest";
import { buildDevelopmentPrompt, inferDevelopmentProduct } from "@/lib/development-prompt";

describe("development prompt", () => {
  it("builds a grounded Codex brief from lead data", () => {
    const prompt = buildDevelopmentPrompt({
      target: "codex",
      product: "internal_system",
      lead: {
        id: "lead-123",
        contactName: "Ana",
        company: "Clínica Aurora",
        niche: "Odontologia",
        projectType: "Sistema interno",
        objective: "Organizar agendamentos",
        mainPain: "Atendimento disperso em planilhas",
        briefing: "Centralizar agenda e pacientes",
        needsLogin: true,
        needsAdmin: true,
        recommendedModules: ["Agenda", "Pacientes"],
        suggestedStack: ["React", "Supabase"],
      },
    });

    expect(prompt).toContain("Clínica Aurora");
    expect(prompt).toContain("Atendimento disperso em planilhas");
    expect(prompt).toContain("Agenda");
    expect(prompt).toContain("Execute build, testes e QA visual");
  });

  it("infers landing pages and SaaS projects", () => {
    expect(inferDevelopmentProduct("Landing page / Site institucional")).toBe("landing_page");
    expect(inferDevelopmentProduct("SaaS / Micro SaaS")).toBe("saas");
  });
});
