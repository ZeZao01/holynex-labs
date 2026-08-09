import { describe, expect, it } from "vitest";
import { buildLeadBriefing, leadImportKey, parseLeadCsv } from "@/lib/lead-import";

describe("lead import", () => {
  it("parses free-form cities and common CSV aliases", () => {
    const [lead] = parseLeadCsv([
      "empresa;contato;whatsapp;cidade;categoria;objetivo",
      "Clínica Aurora;Ana;(11) 99999-0000;Campinas, SP;Odontologia;Criar agendamento online",
    ].join("\n"));
    expect(lead).toMatchObject({ company: "Clínica Aurora", name: "Ana", city: "Campinas, SP", niche: "Odontologia" });
    expect(buildLeadBriefing(lead).details).toContain("Campinas, SP");
  });

  it("creates a stable duplicate key", () => {
    expect(leadImportKey({ name: "Ana", company: "Clínica Áurora", email: "" }))
      .toBe(leadImportKey({ name: " ana ", company: "clinica aurora", email: "" }));
  });

  it("accepts cities from every Brazilian state and the Federal District", () => {
    const capitals = [
      ["Rio Branco", "AC"], ["Maceió", "AL"], ["Macapá", "AP"], ["Manaus", "AM"],
      ["Salvador", "BA"], ["Fortaleza", "CE"], ["Brasília", "DF"], ["Vitória", "ES"],
      ["Goiânia", "GO"], ["São Luís", "MA"], ["Cuiabá", "MT"], ["Campo Grande", "MS"],
      ["Belo Horizonte", "MG"], ["Belém", "PA"], ["João Pessoa", "PB"], ["Curitiba", "PR"],
      ["Recife", "PE"], ["Teresina", "PI"], ["Rio de Janeiro", "RJ"], ["Natal", "RN"],
      ["Porto Alegre", "RS"], ["Porto Velho", "RO"], ["Boa Vista", "RR"],
      ["Florianópolis", "SC"], ["São Paulo", "SP"], ["Aracaju", "SE"], ["Palmas", "TO"],
    ];
    const csv = [
      "nome;empresa;cidade;estado;email",
      ...capitals.map(([city, state], index) => `Lead ${index};Empresa ${index};${city} - ${state};${state};lead${index}@example.com`),
    ].join("\n");

    const leads = parseLeadCsv(csv);

    expect(leads).toHaveLength(27);
    capitals.forEach(([city, state], index) => {
      expect(leads[index].city).toBe(`${city} - ${state}`);
      expect(buildLeadBriefing(leads[index]).details).toContain(`Cidade: ${city} - ${state}`);
    });
  });
});
