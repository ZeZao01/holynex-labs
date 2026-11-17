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

  it("creates a Codex execution brief with real local data and a reusable model", () => {
    const prompt = buildDevelopmentPrompt({
      target: "codex", product: "landing_page",
      lead: { id: "1", contactName: "", company: "Clínica Aurora", niche: "Clínica odontológica", projectType: "Landing page", objective: "Gerar agendamentos", mainPain: "Sem site", briefing: "Lead Google", phone: "+55 11 99999-0000", email: "", googleRating: 4.8, googleReviewCount: 120, prospectScore: 82 },
      projectReference: { title: "Agenda Clínica", category: "Clínicas", niche: "Odontologia", valueProposition: "Agendamento", problemSolved: "Atendimento disperso", commercialDescription: "Base pronta", investmentRange: "R$ 5 mil", baseDeadline: "15 dias", reuseReasons: ["Mesmo nicho"] },
    });
    expect(prompt).toContain("Agenda Clínica");
    expect(prompt).toContain("4.8/5 em 120 avaliações");
    expect(prompt).toContain("menu lateral e o shell");
    expect(prompt).toContain("E-mail real: A definir");
  });
});
