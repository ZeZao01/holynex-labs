# HolyNex Unified Platform

## Papel do sistema

`apps/holynex-platform/` e o nucleo operacional da HolyNex. Ele concentra o ciclo comercial e de entrega sem duplicar dados entre varios paineis.

O app anterior `apps/holynex-leads/` continua preservado como legado funcional. Nenhum dado deve ser removido ou migrado sem backup, comparacao de schema e teste de RLS.

## Fluxo unificado

```text
captacao manual ou CSV
  -> qualificacao do lead
  -> analise assistida
  -> Prompt Studio
  -> proposta
  -> projeto
  -> Brand Studio / QG Brain / Fluxo / skills
  -> QA e entrega
```

## Capacidades implementadas

- Cadastro manual de lead dentro do CRM existente.
- Importacao CSV com virgula ou ponto e virgula, aliases comuns de colunas e cidade em texto livre.
- Pre-visualizacao de importacao e indicacao de registros possivelmente duplicados.
- Prompt Studio dentro do detalhe do lead.
- Prompts direcionados para Codex, Google Stitch ou uso generico.
- Briefing gerado a partir de lead, analise, modulos, stack, riscos, oportunidades, roadmap e portfolio.
- Exportacao do prompt em Markdown e copia para a area de transferencia.
- Hub `QG Agencia` com fluxo operacional, capacidades e atalhos locais.

## Integracoes do QG

| Capacidade | Papel no fluxo | Estado |
|---|---|---|
| HolyNex CRM | fonte de verdade de leads, propostas e projetos | integrado |
| Brand Studio AI | identidade e pecas do projeto | integrado no sistema |
| QG Brain | pesquisa e memoria local | atalho local, servidor separado |
| Fluxo | producao e aprovacao de conteudo | atalho local, servidor separado |
| Codex e Stitch | desenvolvimento a partir do lead | prompt gerado e revisado por humano |
| Supabase | autenticacao e persistencia | existente; ambiente remoto nao alterado nesta etapa |

## Seguranca e governanca

- `.env` local foi removido do rastreamento Git e substituido por `.env.example` sem valores reais.
- Segredos nunca devem entrar em prompts, Markdown, logs ou commits.
- Leads devem vir de fontes proprias, licenciadas ou APIs autorizadas.
- Contato, proposta, publicacao e deploy continuam exigindo aprovacao humana.
- A pasta administrativa `HolyNex Labs/` permanece intacta; arquivos sensiveis devem ser organizados apenas em uma etapa autorizada de cofre e rotacao de credenciais.

## Pendencias antes de producao

1. Aplicar e validar o schema no projeto Supabase definitivo.
2. Testar RLS com pelo menos dois usuarios e workspaces distintos.
3. Definir a migracao dos dados do app legado, com backup e reconciliacao de duplicidades.
4. Conectar fontes externas de leads somente por APIs e contratos autorizados.
5. Configurar OAuth/publicadores do Fluxo e manter aprovacao humana.
6. Resolver gradualmente a divida de lint preexistente do repositorio.
7. Executar QA autenticado das telas internas em desktop e mobile.

## Comandos

Na raiz do QG:

```bash
npm run holynex:dev
npm run holynex:build
npm run holynex:test
npm run holynex:lint
```

Interface local padrao: `http://127.0.0.1:5201/`.
