import type { Proposta } from "@/lib/propostas";
import logoUrl from "@/assets/logo.png";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function formatCurrency(value: number): string {
  return `R$ ${Number(value || 0).toLocaleString("pt-BR")}`;
}

function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function bulletList(items: string[], emptyLabel = "Não informado"): string {
  if (!items.length) {
    return `<p class="muted">${escapeHtml(emptyLabel)}</p>`;
  }

  return `<ul class="bullet-list">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

export function buildPropostaPdfElement(proposta: Proposta, documentCode?: string): HTMLDivElement {
  const pj = (proposta.proposta_json ?? {}) as Record<string, unknown>;
  const funcionalidades = toTextList(pj.funcionalidades);
  const escopo = toTextList(pj.escopo);
  const riscos = toTextList(pj.riscos);
  const proximosPassos = toTextList(pj.proximos_passos);

  const selectedAddons = proposta.proposal_addons.filter((addon) => addon.is_selected);

  const tiersHtml = proposta.proposal_tiers.length
    ? `<section class="section no-break">
        <h2>Planos de investimento</h2>
        <div class="tiers-grid">
          ${proposta.proposal_tiers
            .map((tier) => {
              const isRecommended = tier.is_recommended || tier.type === proposta.recommended_tier;
              return `<article class="tier-card ${isRecommended ? "tier-card--recommended" : ""}">
                ${isRecommended ? '<div class="pill">Recomendado</div>' : ""}
                <h3>${escapeHtml(tier.name)}</h3>
                <p class="price">${formatCurrency(tier.price)}</p>
                <p class="muted">${escapeHtml(`${tier.estimated_days} dias • ${tier.installments || "sem parcelamento"}`)}</p>
                <p>${escapeHtml(tier.description || "")}</p>
                ${bulletList(toTextList(tier.included_items), "Escopo sob consulta")}
              </article>`;
            })
            .join("")}
        </div>
      </section>`
    : "";

  const addonsHtml = selectedAddons.length
    ? `<section class="section no-break">
        <h2>Add-ons selecionados</h2>
        <div class="addons-grid">
          ${selectedAddons
            .map(
              (addon) => `<article class="addon-card">
                <div class="addon-header">
                  <h3>${escapeHtml(addon.name)}</h3>
                  <span>${formatCurrency(addon.price)}</span>
                </div>
                <p class="muted">${escapeHtml(addon.description)}</p>
              </article>`
            )
            .join("")}
        </div>
      </section>`
    : "";

  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-pdf-rebuild", `${Date.now()}-${crypto.randomUUID()}`);
  wrapper.style.position = "fixed";
  wrapper.style.left = "-20000px";
  wrapper.style.top = "0";
  wrapper.style.width = "1200px";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "-1";

  wrapper.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      .pdf-root {
        width: 1200px;
        background: hsl(240 20% 2%);
        color: hsl(0 0% 98%);
        font-family: "Inter", system-ui, -apple-system, sans-serif;
        padding: 48px;
      }
      .hero {
        border: 1px solid hsl(262 98% 71% / 0.3);
        background: linear-gradient(135deg, hsl(262 98% 71% / 0.16), hsl(240 20% 2%));
        border-radius: 24px;
        padding: 32px;
        margin-bottom: 28px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }
      .brand img {
        width: 44px;
        height: 44px;
        object-fit: contain;
      }
      .title {
        margin: 0;
        font-size: 48px;
        line-height: 1.1;
      }
      .subtitle {
        margin: 10px 0 0;
        font-size: 18px;
        color: hsl(240 5% 75%);
      }
      .meta-grid {
        margin-top: 24px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .meta-card {
        border: 1px solid hsl(262 98% 71% / 0.25);
        border-radius: 12px;
        padding: 12px;
        background: hsl(240 15% 8% / 0.7);
      }
      .label {
        display: block;
        font-size: 11px;
        color: hsl(240 5% 70%);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 4px;
      }
      .value {
        font-size: 16px;
        font-weight: 700;
      }
      .section {
        border: 1px solid hsl(240 8% 18%);
        border-radius: 20px;
        background: hsl(240 15% 8% / 0.65);
        padding: 24px;
        margin-bottom: 18px;
      }
      .section h2 {
        margin: 0 0 12px;
        font-size: 24px;
      }
      .section h3 {
        margin: 0 0 8px;
        font-size: 18px;
      }
      .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }
      p { margin: 0; line-height: 1.65; }
      .muted { color: hsl(240 5% 72%); }
      .bullet-list {
        margin: 10px 0 0;
        padding-left: 20px;
        line-height: 1.6;
      }
      .bullet-list li { margin-bottom: 6px; }
      .tiers-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .tier-card {
        position: relative;
        border-radius: 14px;
        border: 1px solid hsl(240 8% 18%);
        background: hsl(240 15% 8% / 0.8);
        padding: 16px;
      }
      .tier-card--recommended {
        border-color: hsl(262 98% 71% / 0.7);
        box-shadow: 0 0 0 2px hsl(262 98% 71% / 0.18);
      }
      .pill {
        display: inline-block;
        margin-bottom: 8px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 4px 8px;
        border-radius: 999px;
        background: hsl(262 98% 71% / 0.2);
        color: hsl(262 100% 85%);
      }
      .price {
        margin: 4px 0;
        font-size: 28px;
        font-weight: 800;
      }
      .addons-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .addon-card {
        border: 1px solid hsl(240 8% 18%);
        border-radius: 12px;
        background: hsl(240 15% 8% / 0.7);
        padding: 14px;
      }
      .addon-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 4px;
      }
      .footer {
        margin-top: 8px;
        text-align: right;
        color: hsl(240 5% 70%);
        font-size: 12px;
      }
      .no-break {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    </style>

    <div class="pdf-root">
      <section class="hero no-break">
        <div class="brand">
          <img src="${logoUrl}" alt="HolyNex" />
          <strong>HolyNex Labs</strong>
        </div>
        <h1 class="title">Proposta Comercial</h1>
        <p class="subtitle">Documento reconstruído em tempo real com o estado atual da proposta.</p>

        <div class="meta-grid">
          <div class="meta-card">
            <span class="label">Cliente</span>
            <span class="value">${escapeHtml(proposta.nome_cliente)}</span>
          </div>
          <div class="meta-card">
            <span class="label">Empresa</span>
            <span class="value">${escapeHtml(proposta.empresa_cliente || "Não informado")}</span>
          </div>
          <div class="meta-card">
            <span class="label">Tipo</span>
            <span class="value">${escapeHtml(proposta.tipo_projeto)}</span>
          </div>
          <div class="meta-card">
            <span class="label">Emitido em</span>
            <span class="value">${formatDate(proposta.criado_em)}</span>
          </div>
        </div>
      </section>

      <section class="section no-break">
        <h2>Resumo executivo</h2>
        <p>${escapeHtml((pj.resumo_executivo as string) || proposta.descricao_projeto || "Sem resumo disponível.")}</p>
      </section>

      <section class="section">
        <div class="grid-2">
          <div>
            <h2>Diagnóstico</h2>
            <p>${escapeHtml((pj.diagnostico as string) || "Não informado")}</p>
          </div>
          <div>
            <h2>Solução proposta</h2>
            <p>${escapeHtml((pj.solucao_proposta as string) || "Não informado")}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="grid-2">
          <div>
            <h3>Escopo</h3>
            ${bulletList(escopo)}
          </div>
          <div>
            <h3>Funcionalidades</h3>
            ${bulletList(funcionalidades)}
          </div>
        </div>
      </section>

      <section class="section no-break">
        <div class="grid-2">
          <div>
            <h3>Investimento mínimo</h3>
            <p class="price">${formatCurrency(proposta.valor_minimo)}</p>
          </div>
          <div>
            <h3>Investimento ideal</h3>
            <p class="price">${formatCurrency(proposta.valor_ideal)}</p>
          </div>
        </div>
        <div class="grid-2" style="margin-top: 10px;">
          <div>
            <h3>Investimento premium</h3>
            <p class="price">${formatCurrency(proposta.valor_premium)}</p>
          </div>
          <div>
            <h3>Validade</h3>
            <p class="muted">${escapeHtml(proposta.proposal_validity || "30 dias")}</p>
          </div>
        </div>
      </section>

      ${tiersHtml}
      ${addonsHtml}

      <section class="section">
        <div class="grid-2">
          <div>
            <h3>Riscos e mitigação</h3>
            ${bulletList(riscos, "Sem riscos críticos listados.")}
          </div>
          <div>
            <h3>Próximos passos</h3>
            ${bulletList(proximosPassos, "A definir com o cliente.")}
          </div>
        </div>
      </section>

      <p class="footer">
        ${documentCode ? `Código do documento: ${escapeHtml(documentCode)} • ` : ""}
        Hash dinâmico de render: ${Date.now()}
      </p>
    </div>
  `;

  return wrapper;
}
