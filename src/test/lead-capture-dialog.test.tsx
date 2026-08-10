import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LeadCaptureDialog from "@/components/admin/LeadCaptureDialog";

vi.mock("@/lib/lead-prospecting", async () => {
  const actual = await vi.importActual<typeof import("@/lib/lead-prospecting")>("@/lib/lead-prospecting");
  return { ...actual, searchLeadProspects: vi.fn() };
});

describe("lead capture dialog", () => {
  it("opens with city and segment prospecting as the primary workflow", () => {
    render(
      <LeadCaptureDialog
        open
        onOpenChange={vi.fn()}
        existingLeads={[]}
        onImported={vi.fn()}
      />
    );

    expect(screen.getByText("Buscar potenciais")).toBeInTheDocument();
    expect(screen.getByText("Marketing / Sites")).toBeInTheDocument();
    expect(screen.getByText("TI / Infraestrutura")).toBeInTheDocument();
    expect(screen.getByText("Software sob medida")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex.: Campinas, SP")).toBeInTheDocument();
    expect(screen.getByText("Especialidade do estabelecimento")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ou digite uma especialidade ainda mais específica")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buscar" })).toBeInTheDocument();
  });
});
