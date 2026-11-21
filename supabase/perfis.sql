-- JúriSmart AI — perfis, privilégios, aprovação e gestão de utilizadores
-- Executar no SQL Editor do Supabase (depois do schema.sql). Pode ser repetido sem problemas.

-- 1) Tabelas ---------------------------------------------------------------
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  perfil text not null check (perfil in ('administrador','juri','avaliador')),
  docente_id uuid references docentes(id) on delete set null,
  estado text not null default 'pendente' check (estado in ('pendente','ativo','desativado')),
  created_at timestamptz default now()
);
alter table perfis enable row level security;

-- Atualização de bases mais antigas: acrescenta "estado" (as contas que já existem ficam ativas,
-- e as que estavam desativadas continuam desativadas).
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'perfis' and column_name = 'estado') then
    alter table perfis add column estado text not null default 'ativo' check (estado in ('pendente','ativo','desativado'));
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'perfis' and column_name = 'ativo') then
      update perfis set estado = case when ativo then 'ativo' else 'desativado' end;
    end if;
    alter table perfis alter column estado set default 'pendente';
  end if;
end $$;

drop table if exists config;   -- o código de administrador deixou de existir

-- Foto de perfil e estado da banca (agendada / examinada)
alter table perfis add column if not exists foto_url text;
alter table juris add column if not exists estado text not null default 'agendada' check (estado in ('agendada','examinada'));
alter table juris add column if not exists examinada_em timestamptz;
alter table juris add column if not exists local text;   -- local da defesa (sala, auditório...)

-- Datas abertas pela secretaria para as defesas (só se pode marcar nestes dias)
create table if not exists datas_defesa (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  hora_inicio time not null default '08:00',
  hora_fim time not null default '17:00',
  duracao_min int not null default 60 check (duracao_min between 15 and 480),
  local text,
  ativa boolean not null default true,
  created_at timestamptz default now(),
  check (hora_fim > hora_inicio)
);
alter table datas_defesa enable row level security;

-- Estudante ligado à sua banca (por id) e justificação da escolha de cada júri
alter table juris add column if not exists estudante_id uuid references perfis(id) on delete set null;
alter table juri_membros add column if not exists justificacao text;
create index if not exists juris_estudante_idx on juris (estudante_id);

-- 2) Funções auxiliares (usadas pelas políticas) ---------------------------
-- Só as contas ativas (aprovadas) têm perfil e docente para efeitos de acesso.
-- Contas pendentes ou desativadas só conseguem ler o seu próprio registo (para a app mostrar o aviso).
create or replace function public.meu_ativo() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select estado = 'ativo' from perfis where id = auth.uid()), false) $$;

create or replace function public.meu_perfil() returns text
language sql stable security definer set search_path = public as
$$ select perfil from perfis where id = auth.uid() and estado = 'ativo' $$;

create or replace function public.meu_docente() returns uuid
language sql stable security definer set search_path = public as
$$ select docente_id from perfis where id = auth.uid() and estado = 'ativo' $$;

create or replace function public.meu_nome() returns text
language sql stable security definer set search_path = public as
$$ select nome from perfis where id = auth.uid() and estado = 'ativo' $$;

-- O docente é membro (presidente, vogal ou suplente) deste júri? (ignora as políticas, para não haver recursão)
create or replace function public.eh_membro(j uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from juri_membros m where m.juri_id = j and m.docente_id = meu_docente()) $$;

-- 3) Ao criar uma conta, cria o perfil (e o docente, se for Júri) ----------
-- Administrador NUNCA se escolhe no registo: só o primeiro utilizador do sistema
-- (quando ainda não existe nenhum) e, depois, por promoção feita por um administrador.
-- Todas as outras contas ficam PENDENTES até o administrador as aprovar.
create or replace function public.novo_utilizador() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  p text := coalesce(m->>'perfil', 'avaliador');
  did uuid;
  est text := 'pendente';
begin
  if not exists (select 1 from perfis where perfil = 'administrador') then
    p := 'administrador'; est := 'ativo';
  elsif p not in ('juri','avaliador') then
    p := 'avaliador';
  end if;

  if p = 'juri' then
    insert into docentes (nome, email, grau, nivel, especialidades)
    values (
      coalesce(nullif(m->>'nome',''), new.email), new.email,
      coalesce(nullif(m->>'grau',''), 'Docente'),
      case when m->>'nivel' in ('Doutorado','Mestrado','Licenciatura') then m->>'nivel' else 'Licenciatura' end,
      coalesce(array(select trim(x) from unnest(string_to_array(coalesce(m->>'especialidades',''), ',')) x where trim(x) <> ''), '{}')
    )
    on conflict (email) do update set email = excluded.email
    returning id into did;
  end if;

  insert into perfis (id, nome, email, perfil, docente_id, estado)
  values (new.id, coalesce(nullif(m->>'nome',''), new.email), new.email, p, did, est);
  return new;
end $$;

drop trigger if exists ao_criar_utilizador on auth.users;
create trigger ao_criar_utilizador after insert on auth.users
  for each row execute function public.novo_utilizador();

-- 4) Contas já existentes sem perfil passam a Administrador ----------------
insert into perfis (id, nome, email, perfil, estado)
select id, coalesce(nullif(raw_user_meta_data->>'nome',''), email), email, 'administrador', 'ativo'
from auth.users on conflict (id) do nothing;

-- Liga os júris antigos ao estudante registado com o mesmo nome (só se houver uma correspondência única)
update juris j set estudante_id = p.id
from perfis p
where j.estudante_id is null and p.perfil = 'avaliador'
  and lower(trim(p.nome)) = lower(trim(j.estudante))
  and (select count(*) from perfis p2 where p2.perfil = 'avaliador' and lower(trim(p2.nome)) = lower(trim(j.estudante))) = 1;

-- 5) Políticas de acesso (substitui todas as anteriores) -------------------
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('perfis','docentes','curriculo_itens','juris','juri_membros','datas_defesa') loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- perfis: cada um vê o seu (mesmo pendente ou desativado, para a app mostrar o aviso); o administrador vê e edita todos
create policy perfis_ver on perfis for select to authenticated
  using (id = auth.uid() or meu_perfil() = 'administrador');
create policy perfis_editar_proprio on perfis for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and perfil = meu_perfil() and estado = 'ativo' and docente_id is not distinct from meu_docente());
create policy perfis_editar_admin on perfis for update to authenticated
  using (meu_perfil() = 'administrador') with check (meu_perfil() = 'administrador');

-- docentes: o administrador vê todos; os restantes só vêem o próprio registo e os docentes das suas bancas
create policy docentes_ver on docentes for select to authenticated using (
  meu_perfil() = 'administrador'
  or id = meu_docente()
  or exists (select 1 from juri_membros m where m.docente_id = docentes.id)
  or exists (select 1 from juris j where j.orientador_id = docentes.id)
);
create policy docentes_inserir on docentes for insert to authenticated with check (meu_perfil() = 'administrador');
create policy docentes_editar on docentes for update to authenticated
  using (meu_perfil() = 'administrador' or id = meu_docente())
  with check (meu_perfil() = 'administrador' or id = meu_docente());
create policy docentes_apagar on docentes for delete to authenticated using (meu_perfil() = 'administrador');

-- currículo: vê-se o dos docentes que se pode ver; administrador e o próprio docente escrevem
create policy itens_ver on curriculo_itens for select to authenticated
  using (exists (select 1 from docentes d where d.id = curriculo_itens.docente_id));
create policy itens_escrever on curriculo_itens for all to authenticated
  using (meu_perfil() = 'administrador' or docente_id = meu_docente())
  with check (meu_perfil() = 'administrador' or docente_id = meu_docente());

-- júris: o administrador vê todos; o estudante só o seu; o júri só aqueles em que é membro ou orientador
create policy juris_ver on juris for select to authenticated using (
  meu_perfil() = 'administrador'
  or (estudante_id = auth.uid() and meu_ativo())
  or orientador_id = meu_docente()
  or eh_membro(id)
);
create policy juris_admin on juris for all to authenticated
  using (meu_perfil() = 'administrador') with check (meu_perfil() = 'administrador');

create policy membros_ver on juri_membros for select to authenticated
  using (exists (select 1 from juris j where j.id = juri_id));
create policy membros_admin on juri_membros for all to authenticated
  using (meu_perfil() = 'administrador') with check (meu_perfil() = 'administrador');

-- datas de defesa: só o administrador vê e gere
create policy datas_admin on datas_defesa for all to authenticated
  using (meu_perfil() = 'administrador') with check (meu_perfil() = 'administrador');

-- 6) Operações do administrador (executam de forma atómica no servidor) ----
-- Excluir uma conta (apaga também o perfil). Não permite excluir a própria.
create or replace function public.excluir_utilizador(alvo uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if meu_perfil() is distinct from 'administrador' then raise exception 'Sem permissão'; end if;
  if alvo = auth.uid() then raise exception 'Não pode excluir a sua própria conta'; end if;
  delete from auth.users where id = alvo;
end $$;

-- Substituir a mesa de um júri (editar banca) numa só transacção.
create or replace function public.substituir_membros(p_juri uuid, p_membros jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if meu_perfil() is distinct from 'administrador' then raise exception 'Sem permissão'; end if;
  delete from juri_membros where juri_id = p_juri;
  insert into juri_membros (juri_id, docente_id, papel, compatibilidade, justificacao)
  select p_juri, (m->>'docente_id')::uuid, m->>'papel', nullif(m->>'compatibilidade','')::int, m->>'justificacao'
  from jsonb_array_elements(p_membros) m;
end $$;

revoke all on function public.excluir_utilizador(uuid) from public, anon;
revoke all on function public.substituir_membros(uuid, jsonb) from public, anon;
grant execute on function public.excluir_utilizador(uuid) to authenticated;
grant execute on function public.substituir_membros(uuid, jsonb) to authenticated;

-- 7) Já não é preciso: substituído por "estado" (apagado no fim, depois de as políticas deixarem de o usar)
alter table perfis drop column if exists ativo;

-- 8) Fotografias de perfil (Supabase Storage) ------------------------------
-- Pasta pública "avatars"; cada pessoa só escreve na sua própria subpasta (id do utilizador).
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
      on conflict (id) do update set public = true;

    drop policy if exists avatars_ver on storage.objects;
    drop policy if exists avatars_inserir on storage.objects;
    drop policy if exists avatars_atualizar on storage.objects;
    drop policy if exists avatars_apagar on storage.objects;

    create policy avatars_ver on storage.objects for select using (bucket_id = 'avatars');
    create policy avatars_inserir on storage.objects for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
    create policy avatars_atualizar on storage.objects for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
    create policy avatars_apagar on storage.objects for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;
