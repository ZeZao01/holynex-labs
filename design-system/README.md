# HolyNex Design System

Design system for **HolyNex Labs Ltda.** — a modern, clean admin dashboard with full mobile access and no feature loss on desktop. UI copy is **pt-BR**.

## Sources
- `uploads/logo.png` — HolyNex mark (magenta → violet → blue phoenix with circuit detailing). Copied to `assets/logo.png` and cropped to `assets/logo-mark.png`.
- `uploads/01–08.webp` — a third-party case study (“Fynix”, AI finance dashboard) supplied as **style reference only**. Its layout vocabulary (grey canvas, white hairline cards, pill buttons, hero KPI card, AI orb, Urbanist / Plus Jakarta Sans / Space Grotesk) was adopted; its brand (name, green palette, logo) was **not**. Colors were re-derived from the HolyNex mark.
- No codebase or Figma was provided. The component inventory is therefore a standard admin set (see below).

## Content fundamentals
- Language: Brazilian Portuguese, “você” implied, rarely stated. Sentence case everywhere (“Faturas recentes”, not “Faturas Recentes”).
- Tone: calm, competent, operational. Short labels; descriptions are one line (“Acompanhe receita, clientes e operações em tempo real.”).
- Numbers are the hero: `R$ 86.240`, `+8,1%`, `12/12` — pt-BR separators, `R$` with a space, dates `dd/mm/aaaa`.
- Nex AI speaks in first person, warm but brief, bolding the key figure: “Encontrei **2 cobranças duplicadas**…”. Greeting: “Bom te ver, Rafael!”.
- Statuses are single words: Pago, Pendente, Vencida, Ativo, Em teste, Atrasado.
- No emoji. Unicode only for ⌘ / K in keyboard hints.

## Visual foundations
- **Color**: violet `#6C1CF6` is the single accent (actions, active states, focus). Deep indigo ink `#120A2E` for text, dark buttons and the lead chart series. Cool faint-violet greys for canvas (`#F4F4F6`) and borders (`#E7E7EB`). Status pairs: soft tint bg + strong fg.
- **Gradient** (`--gradient-brand`, from the logo) is reserved: logo, Nex AI orb, mobile AI button. The hero KPI card uses flat violet with two soft radial glows (magenta top-right, azure bottom-left). Nowhere else.
- **Type**: Urbanist for UI and display (headlines mix light 300 + semibold 600 on one line); Plus Jakarta Sans for long-form copy (AI answers); Space Grotesk tabular figures for IDs, dates, axis labels, kbd (`.hn-num`). Dense scale 11–48px.
- **Layout**: 248px sidebar ≥1024px → drawer + hamburger 768–1023 → single column + bottom nav <768. Cards in CSS grid, gap 16 (12 mobile). Content max 1480px. Topbar sticky with translucent blur.
- **Cards**: white, 1px `--border-subtle`, 16px radius, 20px padding (16 mobile), no shadow. Nested tiles are grey `--surface-sunken`, 12px radius, no border. Never white-on-white.
- **Shadows**: flat by default. xs for active nav pill, md for toasts/tooltips, lg for dialogs, brand glow for the AI fab.
- **Radii**: pills (999) for buttons/badges/chips/search; 10 inputs & nav items; 12 tiles; 16 cards; 20 dialogs; 28 app icon.
- **Interaction**: hover = one step darker (accent → violet-700) or neutral-25 wash for outlined; press = scale(.98); focus = 3px violet ring at 22%. Motion 120/180/280ms, `cubic-bezier(.2,.8,.2,1)`, no bounce; dialogs pop 8px up, sheets slide from bottom.
- **Transparency/blur**: only topbar, bottom nav and dialog scrim.
- **Imagery**: none required; avatars fall back to initials on violet-100. No illustrations were supplied.
- **Mobile**: tables become stacked cards via container query (<520px container); KPI tiles become horizontal snap-scrollers; dialogs become bottom sheets; hit targets ≥44px.

## Iconography
- **Lucide** (outline, 2px stroke, rounded joins) — self-hosted icon font at `assets/icons/lucide/` (lucide-static 0.460.0), loaded through `styles.css`. Use `<Icon name="…" />` or `<i class="icon-name">`.
- Substitution flag: the reference used a similar outline set (Iconsax-like); Lucide is the closest open match.
- Sizes 16 (tables) / 18 (default) / 20 (nav). Icons inside round 28px tiles for KPI labels. No emoji, no PNG icons.

## Index
- `styles.css` — entry (imports only) · `tokens/` colors, typography, spacing, effects, fonts, base · `fonts/` Urbanist, Plus Jakarta Sans, Space Grotesk (Google Fonts, OFL, variable woff2)
- `assets/` logo.png, logo-mark.png, icons/lucide
- `guidelines/` foundation cards (Colors, Type, Spacing, Brand)
- `components/` core, forms, display, navigation, feedback, data, shell (each with `*.card.html`)
- `ui_kits/admin/` interactive admin (index.html desktop/responsive, mobile.html phone frames)
- `tools/ds-fallback.js` — dev-only; builds the namespace from sources if `_ds_bundle.js` is missing
- `SKILL.md`

## Components
- core: Button, IconButton, Icon
- forms: Input, Select, Checkbox, Radio, Switch
- display: Card, StatCard, Badge, Chip, Avatar, Progress
- navigation: Tabs, Breadcrumb, Pagination
- feedback: Dialog, Toast, Tooltip
- data: DataTable, BarChart, AreaChart, DonutChart
- shell: Sidebar, Topbar, BottomNav

### Intentional additions
No source component library existed; all of the above are authored from the reference screens plus standard admin needs. Icon wraps the Lucide font.
