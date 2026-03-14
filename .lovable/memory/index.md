# Memory: index.md
Updated: now

Design system: dark cyberpunk theme, HSL colors, Space Grotesk + Inter fonts.

- Primary: 262 98% 71% (purple)
- Background: 240 20% 2% (near-black)
- WhatsApp number: already configured in WhatsAppFloat component
- Admin routes are hidden (not in navbar): /admin/login, /admin/orcamentos, /admin/propostas
- Edge function `gerar-proposta` uses 4-agent Genspark pipeline (Normalizer→Pricer→Writer→Assembler)
- Pipeline output: proposta (PropostaJSON) + document_spec (DocumentSpec) + pricing_sheet (PricingSheet)
- Database tables: `orcamentos` (quotes), `propostas` (AI-generated proposals)
- Language: Portuguese (BR) with i18n support
- User prefers: IA calculates all financial values, full proposal + PDF + dashboard
- PDF generator: NO hardcoded templates/fallbacks, 100% AI-generated content
- gerarPropostaIA returns GerarPropostaResult { proposta, document_spec, pricing_sheet }
- PDF includes: pricing table, terms & conditions, compliance (exclusions/assumptions)
