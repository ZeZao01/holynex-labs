Design system: dark cyberpunk theme, HSL colors, Space Grotesk + Inter fonts.

- Primary: 262 98% 71% (purple)
- Background: 240 20% 2% (near-black)
- WhatsApp number: already configured in WhatsAppFloat component
- Admin routes are hidden (not in navbar): /admin/login, /admin/dashboard, etc.
- Edge function `gerar-proposta` uses Lovable AI (gemini-2.5-flash) for commercial proposals
- Database tables: `orcamentos`, `propostas`, `pdf_versoes`, `delivered_systems`, `projects`, `project_modules`, `project_accesses`, `project_changes`, `portfolio_items`, `audit_logs`
- Language: Portuguese (BR) with i18n support
- User prefers: IA calculates all financial values, full proposal + PDF + dashboard
- All 15 phases complete: Structure, Dashboard, Leads, Proposals, PDFs, Projects, Systems, Accesses, Modules, Maintenance, Portfolio, Models, Financial, Security, QA
- Reusable admin components: PageHeader, StatCard, StatsGrid, EmptyState, FilterToolbar, StatusBadge, SectionCard
- Types/constants in src/lib/ (projects.ts, project-modules.ts, audit-logs.ts, etc.)
- Sidebar groups: Comercial, Operacional, Estratégico, Sistema
- Phase 15 (QA) refinements: responsive StatCards, skeleton loading, breadcrumb in topbar, real counts in dashboard
- PWA enabled: vite-plugin-pwa, manifest, service worker auto-update, installable from browser
- Realtime enabled: all main tables via supabase_realtime publication, useRealtimeSubscription hook
- Button effect: single-direction neon shimmer with pulsing glow (not splitting)
