# DESIGN.md: contrato visual da HolyNex Labs

Fonte da verdade do visual deste projeto. Agentes (Claude Code, Codex, Lovable) leem este arquivo antes de criar ou mudar interface.

## Onde cada visual vale

| Área | Visual | Fonte |
|---|---|---|
| **Painel admin** (`/admin/*`) | **HolyNex Design System**: claro, canvas cinza, cartões brancos, violeta como único destaque | `design-system/` (este contrato) |
| **Site público** (`/`, `/servicos`, `/portfolio`...) | Escuro e cinematográfico (família 5 dos modelos da agência), com tokens shadcn em `src/index.css` | `src/index.css`, `tailwind.config.ts` |

Os dois visuais convivem sem se misturar: os tokens do design system só valem **dentro de um elemento com a classe `.hn-ds`** (veja "Por que .hn-ds").

## Tokens principais (HolyNex Design System)

| Papel | Token | Valor |
|---|---|---|
| Destaque (ações, ativo, foco) | `--accent` | `#6C1CF6` (violet-600) |
| Texto e botão escuro | `--ink-950` | `#120A2E` |
| Fundo do canvas | `--bg-canvas` | neutral-50 (`#F4F4F6`) |
| Cartão | `--surface-card` | branco |
| Borda fina | `--border-subtle` | neutral-150 |
| Gradiente da marca (só logo, orbe da IA e botão de IA no celular) | `--gradient-brand` | magenta `#E115F4` → violeta → azul `#1E9BF5` |
| Fonte de interface e títulos | `--font-ui` | Urbanist |
| Fonte de texto longo | `--font-body` | Plus Jakarta Sans |
| Números, datas e IDs | `--font-numeric` (classe `.hn-num`) | Space Grotesk, números tabulares |
| Raios | `--radius-*` | pílula 999 (botões, badges), 10 (inputs), 12 (blocos), 16 (cartões), 20 (diálogos) |
| Tempo de animação | `--dur-fast`, `--dur-base`, `--dur-slow` | 120, 180 e 280 ms, sem quique |

Valores completos: `design-system/tokens/*.css`. Guias visuais: `design-system/guidelines/*.html`.

## Regras
1. **Nada fixo no código:** cor, fonte, espaçamento ou raio fixo é proibido em interface nova; usar os tokens. O que já existe é convertido aos poucos, a cada página mexida.
2. **Componente novo nasce da biblioteca:** antes de criar um botão, cartão, tabela ou gráfico, usar o de `@ds`. Se não existir, criar dentro de `design-system/components/<grupo>/` com `.jsx`, `.d.ts`, `.prompt.md` e CSS no arquivo do grupo, e incluir na vitrine.
3. **Estados obrigatórios:** default, hover, active, focus visível, desativado, carregando, erro, vazio e selecionado (quando se aplica).
4. **Texto em pt-BR**, com inicial maiúscula só na primeira palavra ("Faturas recentes"); dinheiro como `R$ 86.240`; datas como `dd/mm/aaaa`; status de uma palavra (Pago, Pendente, Vencida). Sem emoji.
5. **Celular sem perder nada:** abaixo de 768 px a navegação vai para o `BottomNav`; tabela vira cartões; alvo de toque com no mínimo 44 px.
6. **Só tema claro no admin.** O design system não tem tema escuro; criar um é decisão de design, não ajuste.

## Como usar no código
```tsx
import "@ds/holynex-ds.scoped.css";        // estilos, presos em .hn-ds
import { Button, StatCard, DataTable } from "@ds";

<div className="hn-ds"> ... </div>          // tudo do design system fica aqui dentro
```

## Por que `.hn-ds`
Os tokens do design system usam nomes como `--accent`, os mesmos do shadcn/ui deste projeto, mas em outro formato. Soltos no `:root`, quebrariam as cores do site inteiro. O `scripts/ds-scope.mjs` gera `design-system/holynex-ds.scoped.css` com tudo preso em `.hn-ds`.

**Ao mudar qualquer arquivo em `design-system/`, rodar `node scripts/ds-scope.mjs`.**

## Mapa da biblioteca (`design-system/`)
| Pasta | O que tem |
|---|---|
| `tokens/` | cores, tipografia, espaçamento, efeitos, fontes, base |
| `fonts/` | Urbanist, Plus Jakarta Sans e Space Grotesk (OFL, woff2) |
| `assets/` | logo, marca recortada e ícones Lucide (fonte própria) |
| `components/<grupo>/` | 27 componentes em 7 grupos: core, forms, display, navigation, feedback, data e shell. Cada um com `.jsx`, `.d.ts` (tipos) e `.prompt.md` (como usar), e CSS por grupo |
| `components/<grupo>/*.card.html`, `guidelines/*.html`, `ui_kits/admin/` | **Referência visual**: abrem direto no navegador, sem build |
| `index.js` + `index.d.ts` | ponto de entrada (`@ds`) |
| `holynex-ds.scoped.css` | gerado; não editar à mão |
| `_adherence.oxlintrc.json` | regras de lint de aderência do Claude Design (feitas para o oxlint; ver "Pendente") |
| `README.md` | fundamentos de conteúdo, visual e ícones |

**Vitrine:** `/admin/design-system`, com login. Em modo de desenvolvimento também em `/dev/design-system`, sem login; essa rota não entra no build de produção.

## Pendente
- **Migrar as páginas do admin** para os componentes `@ds`, uma por vez (começar pelo `AdminDashboard` e pelo `AdminFinanceiro`, que são do mesmo tipo do modelo).
- **Lint de aderência:** o `_adherence.oxlintrc.json` é do oxlint; o projeto usa ESLint. Decidir entre adicionar o oxlint como verificação extra ou traduzir as regras para ESLint.

Origem: export do Claude Design feito pelo José (17/11/2026), modelo 4 "SaaS e painel" da agência, integrado pela skill `integrar-design-system`.
