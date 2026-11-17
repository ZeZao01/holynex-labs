# Migração: Supabase da Lovable → Supabase próprio

Feita em 17/11/2026. Projeto novo: **HolyNex Labs Ltda.** (`ioqafyypnlzcbxzclehv`, us-east-2). Projeto antigo (Lovable): `aeulestxwyhzsrltiwum`.

Ramo `migracao-supabase`: o código já aponta para o projeto novo (`.env.production`, `supabase/config.toml`, cache do PWA no `vite.config.ts`). **Só juntar ao `main` depois que os passos 1 a 3 abaixo estiverem feitos**, senão o site abre sem dados.

## O que veio do backup (`holynex-labs_261117.backup`, pg_dump 18)
- 57 tabelas, 11 funções, 40 triggers, 168 regras RLS e as tabelas marcadas para realtime.
- **Dados:**
  - 2 usuários do login, com as mesmas senhas (vão criptografadas);
  - 2 perfis e 3 papéis atribuídos;
  - 3 orçamentos;
  - 1.667 permissões por papel;
  - 124 registros de auditoria e 44 eventos de segurança;
  - configurações de agentes de marca.
- **Arquivos:**
  - 8 buckets e 26 regras de acesso;
  - a lista de 22 arquivos.

  **Os arquivos em si não estão no backup**: o pg_dump não copia o Storage.

Os SQLs prontos ficam **fora do repositório** (têm dados de clientes): `G:\Backups_Jose_Wilk\migracao-supabase-holynex-2026-11-17\`.

## Passos
1. **Banco:** no painel do projeto novo, abrir o SQL Editor e rodar, um por vez e nesta ordem:
   - `01_estrutura.sql` (tabelas, funções, regras, buckets);
   - `02_usuarios.sql`;
   - `03_dados.sql`;
   - `04_finalizar.sql` (o gatilho que cria o perfil de usuário novo, ligado só depois dos dados para não duplicar).

   Se a criação dos buckets falhar no 01, criar os 8 buckets pelo painel (Storage) com os mesmos nomes e rodar o resto.
2. **Login:** em Authentication → URL Configuration, colocar a URL do site e as URLs de retorno. Desligar "Allow new users to sign up" se o admin não deve aceitar cadastro aberto.
3. **Edge Functions** (18, em `supabase/functions/`), pela CLI do Supabase, com o login feito pelo José:
   ```bash
   npx supabase login
   npx supabase link --project-ref ioqafyypnlzcbxzclehv
   npx supabase functions deploy
   ```
   **Segredos** (Edge Functions → Secrets):
   - `GROQ_API_KEY` e/ou `OPENROUTER_API_KEY`;
   - `GOOGLE_MAPS_API_KEY` (prospectar leads);
   - `ADMIN_BOOTSTRAP_EMAILS`.

   `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem por padrão. A `LOVABLE_API_KEY` não existe fora da Lovable; o `analisar-orcamento` cai sozinho para OpenRouter ou Groq.
4. **Arquivos do Storage:** baixar do projeto antigo os 22 arquivos (PDFs, portfólio, anexos de orçamento), subir nos buckets com o mesmo caminho e só então rodar `99_arquivos_pendentes.sql`.
5. **Conferir** (o Claude faz pelo conector do Supabase): contagem por tabela, avisos de segurança (advisors), login do admin e uma página de cada módulo.
6. **Publicar:** juntar `migracao-supabase` no `main` e atualizar o deploy.
