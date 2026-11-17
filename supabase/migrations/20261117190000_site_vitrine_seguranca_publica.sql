-- Site como vitrine e captação (17/11/2026). Fecha as brechas públicas apontadas na auditoria
-- (outputs/holynex-labs/PRONTIDAO-2026-11-17.md na Agência). Aplicada pelo conector no projeto ioqafyypnlzcbxzclehv.

-- 1) Proposta pública: só pelo link exato e só com os campos do cliente.
create or replace function public.get_public_proposal(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(x) from (
    select id, criado_em, status, nome_cliente, empresa_cliente, segmento, tipo_projeto, descricao_projeto,
           proposta_json, proposal_tiers, proposal_addons, recommended_tier, commercial_notes, proposal_validity,
           is_phased, structured_content, document_spec, portfolio_refs, public_token, is_public
    from public.propostas
    where p_token is not null and length(p_token) >= 16 and public_token = p_token and is_public = true
    limit 1
  ) x;
$$;
revoke all on function public.get_public_proposal(text) from public;
grant execute on function public.get_public_proposal(text) to anon, authenticated;
drop policy if exists "Anyone can read public propostas by token" on public.propostas;

-- 2) Anexos do formulário: continua aceitando envio sem login, mas com limite de tamanho e tipo; apagar só admin.
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif','application/pdf']
 where id = 'orcamentos-assets';
drop policy if exists "Authenticated can delete orcamento assets" on storage.objects;
create policy "Admin can delete orcamento assets" on storage.objects
  for delete to authenticated using (bucket_id = 'orcamentos-assets' and public.is_admin(auth.uid()));

-- 3) Formulário de contato: tamanho máximo dos campos e no máximo 5 envios por e-mail por hora.
create or replace function public.limitar_envio_orcamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    if length(coalesce(new.nome,'')) > 120 or length(coalesce(new.email,'')) > 160
       or length(coalesce(new.descricao,'')) > 5000 or length(coalesce(new.empresa,'')) > 160 then
      raise exception 'Campos acima do tamanho permitido';
    end if;
    if new.email is not null and (
      select count(*) from public.orcamentos o
      where lower(o.email) = lower(new.email) and o.criado_em > now() - interval '1 hour'
    ) >= 5 then
      raise exception 'Muitos envios em pouco tempo. Tente de novo mais tarde.';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.limitar_envio_orcamento() from anon, authenticated, public;
drop trigger if exists trg_limitar_envio_orcamento on public.orcamentos;
create trigger trg_limitar_envio_orcamento before insert on public.orcamentos
  for each row execute function public.limitar_envio_orcamento();
