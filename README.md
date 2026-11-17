# HolyNex Labs - Plataforma Unificada

Sistema interno e site institucional da HolyNex Labs. O projeto concentra CRM de leads, propostas e PDFs, projetos, sistemas entregues, financeiro, Brand Studio AI e o Hub operacional do QG Agencia.

## Desenvolvimento local

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5201
```

Crie `.env` a partir de `.env.example`. Nunca versionar valores reais.

## Validacao

```sh
npm run test
npm run typecheck
npm run build
npm run lint
npm run validate:release
```

O lint global possui divida tecnica herdada. Para uma entrega, build e testes precisam passar e os arquivos alterados devem passar no lint direcionado.

## Fluxo principal

```text
captacao manual ou CSV
  -> qualificacao e analise
  -> Prompt Studio
  -> proposta e PDF
  -> projeto
  -> Brand Studio / QG Brain / Fluxo
  -> QA e entrega
```

Arquitetura, seguranca e pendencias de producao: [`HOLYNEX_UNIFIED_ARCHITECTURE.md`](HOLYNEX_UNIFIED_ARCHITECTURE.md).

Ultima homologacao: [`docs/READINESS_REPORT_2026-08-09.md`](docs/READINESS_REPORT_2026-08-09.md).

## Infraestrutura

- **Banco, login, arquivos e funções:** Supabase próprio da HolyNex (`ioqafyypnlzcbxzclehv`). Migração da Lovable em `docs/MIGRACAO-SUPABASE.md`.
- **Código:** GitHub `ZeZao01/holynex-labs`. A Lovable não é mais usada em nada.
- **Edge Functions:** `npx supabase functions deploy`, com o projeto ligado via `npx supabase link --project-ref ioqafyypnlzcbxzclehv`.
- **Visual:** `DESIGN.md` (contrato) e `design-system/`.

## Design system

O painel admin usa o **HolyNex Design System** (`design-system/`), em tema claro e escuro. Regras, tokens e o mapa da biblioteca estão em [DESIGN.md](DESIGN.md). Vitrine em `/admin/design-system`. Depois de mudar `design-system/`, rode `npm run ds:scope`.
