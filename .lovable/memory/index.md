Edge function gerar-proposta pipeline, provider priority, PDF generation, and project constraints.

- Primary: 262 98% 71% (purple)
- Background: 240 20% 2% (near-black)
- WhatsApp number: already configured in WhatsAppFloat component
- Admin routes are hidden (not in navbar): /admin/login, /admin/orcamentos, /admin/propostas
- Edge function `gerar-proposta` v6.0: SINGLE-PASS (1 AI call, replaces 4-agent pipeline that was timing out)
- Provider priority: Lovable AI → Genspark → Groq → OpenRouter (all failover, no throwing on 429)
- Pipeline output: proposta (PropostaJSON) + document_spec (null) + pricing_sheet (null)
- Database tables: `orcamentos` (quotes), `propostas` (AI-generated proposals)
- Language: Portuguese (BR) with i18n support
- User prefers: IA calculates all financial values, full proposal + PDF + dashboard
- PDF generator: NO hardcoded templates/fallbacks, 100% AI-generated content
- gerarPropostaIA returns GerarPropostaResult { proposta, document_spec, pricing_sheet }
- PDF includes: pricing table, terms & conditions, compliance (exclusions/assumptions)
- Design system: dark cyberpunk theme, HSL colors, Space Grotesk + Inter fonts
