Design system: dark cyberpunk theme, HSL colors, Space Grotesk + Inter fonts.

- Primary: 262 98% 71% (purple)
- Background: 240 20% 2% (near-black)
- WhatsApp number: already configured in WhatsAppFloat component
- Admin routes are hidden (not in navbar): /admin/login, /admin/orcamentos, /admin/propostas
- Edge functions use multi-provider AI: Groq (primary) → OpenRouter (fallback) → Lovable AI (last resort)
- Secrets configured: GROQ_API_KEY, OPENROUTER_API_KEY, LOVABLE_API_KEY
- Database tables: `orcamentos` (quotes), `propostas` (AI-generated proposals)
- Language: Portuguese (BR) with i18n support
- User prefers: IA calculates all financial values, full proposal + PDF + dashboard
- PDF: jsPDF + html2canvas, A4, HolyNex Labs branding (azul escuro, branco, cinza)
