# Memory: index.md
Design system: dark cyberpunk theme, HSL colors, Space Grotesk + Inter fonts.

- Primary: 262 98% 71% (purple)
- Background: 240 20% 2% (near-black)
- WhatsApp number: already configured in WhatsAppFloat component
- Admin routes are hidden (not in navbar): /admin/login, /admin/dashboard, etc.
- Edge function `gerar-proposta` uses Lovable AI (gemini-2.5-flash) for commercial proposals
- Database tables: `orcamentos` (quotes), `propostas` (AI-generated proposals), `pdf_versoes`
- Language: Portuguese (BR) with i18n support
- User prefers: IA calculates all financial values, full proposal + PDF + dashboard
- Phase 1 complete: Admin panel restructured as agency master panel with 13 modules
- Reusable admin components: PageHeader, StatCard, StatsGrid, EmptyState, FilterToolbar, StatusBadge, SectionCard
- Types/constants in src/lib/admin-types.ts
- Sidebar groups: Operacional, Projetos, Comercial, Sistema
