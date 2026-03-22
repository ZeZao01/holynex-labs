Edge function gerar-proposta pipeline, provider priority, PDF generation, and project constraints.

- Primary: 262 98% 71% (purple)
- Background: 240 20% 2% (near-black)
- WhatsApp number: already configured in WhatsAppFloat component
- Admin routes are hidden (not in navbar): /admin/login, /admin/orcamentos, /admin/propostas
- Edge function `gerar-proposta` v7.0: SINGLE-PASS full structured output (proposta + structured_content + pricing_sheet + stitch_prompt + hidden_addons + portfolio_refs + pdf_blueprint)
- AI Providers: Groq (primary) → OpenRouter (fallback). Lovable AI DISABLED by user request.
- Provider priority: Groq → OpenRouter (only these two, no Lovable AI, no Genspark)
- Pipeline output: proposta + structured_content + pricing_sheet + stitch_prompt + hidden_addons + portfolio_refs + pdf_blueprint
- Database tables: `orcamentos` (quotes), `propostas` (AI-generated proposals with structured artifacts)
- propostas table has columns: structured_content, pricing_sheet, document_spec, stitch_prompt, hidden_addons, portfolio_refs, pdf_blueprint, ai_metadata (all jsonb/text)
- Language: Portuguese (BR) with i18n support
- User prefers: IA calculates all financial values, full proposal + PDF + dashboard
- PDF generator: NO hardcoded templates/fallbacks, 100% AI-generated content
- gerarPropostaIA returns GerarPropostaResult { proposta, structured_content, document_spec, pricing_sheet, stitch_prompt, hidden_addons, portfolio_refs, pdf_blueprint, ai_metadata }
- PDF includes: pricing table, terms & conditions, compliance (exclusions/assumptions)
- Design system: dark cyberpunk theme, HSL colors, Space Grotesk + Inter fonts
- PDF style: Genspark Slides-inspired (v4) — dark navy bg, decorative circles, category badges, numbered cards with colored top borders, watermark numbers, bold typography
- PDF pages: Cover → Executive Summary → Scope/Features → Investment → Strategic Benefits → Tiers (conditional) → Timeline → Risks → Closing
