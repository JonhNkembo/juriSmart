-- JúriSmart AI — perfis e privilégios
-- Executar UMA vez no SQL Editor do Supabase (depois do schema.sql). Pode ser repetido sem problemas.

-- 1) Tabelas ---------------------------------------------------------------
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  perfil text not null check (perfil in ('administrador','juri','avaliador')),
  docente_id uuid references docentes(id) on delete set null,
  created_at timestamptz default now()
);

-- Código exigido para criar contas de Administrador. ALTERE-O (ver instruções no fim).
create table if not exists config (chave text primary key, valor text not null);
insert into config (chave, valor) values ('codigo_admin', 'admin-jurismart') on conflict (chave) do nothing;
alter table config enable row level security;   -- sem políticas: o navegador nunca lê esta tabela

alter table perfis enable row level security;

-- 2) Funções auxiliares (usadas pelas políticas) ---------------------------
create or replace function public.meu_perfil() returns text
language sql stable security definer set search_path = public as
$$ select perfil from perfis where id = auth.uid() $$;

create or replace function public.meu_docente() returns uuid
language sql stable security definer set search_path = public as
$$ select docente_id from perfis where id = auth.uid() $$;

create or replace function public.meu_nome() returns text
language sql stable security definer set search_path = public as
$$ select nome from perfis where id = auth.uid() $$;

-- 3) Ao criar uma conta, cria o perfil (e o docente, se for Júri) ----------
create or replace function public.novo_utilizador() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  p text := coalesce(m->>'perfil', 'avaliador');
  did uuid;
begin
  if p not in ('administrador','juri','avaliador') then p := 'avaliador'; end if;

  if p = 'administrador' and coalesce(m->>'codigo','') <> (select valor from config where chave = 'codigo_admin') then
    raise exception 'Código de administrador inválido';
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

  insert into perfis (id, nome, email, perfil, docente_id)
  values (new.id, coalesce(nullif(m->>'nome',''), new.email), new.email, p, did);
  return new;
end $$;

drop trigger if exists ao_criar_utilizador on auth.users;
create trigger ao_criar_utilizador after insert on auth.users
  for each row execute function public.novo_utilizador();

-- 4) Contas já existentes passam a Administrador (são as que criou até agora)
insert into perfis (id, nome, email, perfil)
select id, coalesce(nullif(raw_user_meta_data->>'nome',''), email), email, 'administrador'
from auth.users on conflict (id) do nothing;

-- 5) Políticas de acesso (substitui todas as anteriores) -------------------
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('perfis','docentes','curriculo_itens','juris','juri_membros') loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- perfis: cada um vê e edita o seu (sem mudar o próprio perfil); o administrador vê e edita todos
create policy perfis_ver on perfis for select to authenticated
  using (id = auth.uid() or meu_perfil() = 'administrador');
create policy perfis_editar_proprio on perfis for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and perfil = meu_perfil() and docente_id is not distinct from meu_docente());
create policy perfis_editar_admin on perfis for update to authenticated
  using (meu_perfil() = 'administrador') with check (meu_perfil() = 'administrador');

-- docentes: todos consultam; administrador gere todos; cada Júri edita o seu registo
create policy docentes_ver on docentes for select to authenticated using (true);
create policy docentes_inserir on docentes for insert to authenticated with check (meu_perfil() = 'administrador');
create policy docentes_editar on docentes for update to authenticated
  using (meu_perfil() = 'administrador' or id = meu_docente())
  with check (meu_perfil() = 'administrador' or id = meu_docente());
create policy docentes_apagar on docentes for delete to authenticated using (meu_perfil() = 'administrador');

-- currículo: todos consultam; administrador e o próprio docente escrevem
create policy itens_ver on curriculo_itens for select to authenticated using (true);
create policy itens_escrever on curriculo_itens for all to authenticated
  using (meu_perfil() = 'administrador' or docente_id = meu_docente())
  with check (meu_perfil() = 'administrador' or docente_id = meu_docente());

-- júris: administrador e júri vêem todos; avaliador só o seu (pelo nome do estudante); só o administrador escreve
create policy juris_ver on juris for select to authenticated
  using (meu_perfil() in ('administrador','juri') or lower(trim(estudante)) = lower(trim(meu_nome())));
create policy juris_admin on juris for all to authenticated
  using (meu_perfil() = 'administrador') with check (meu_perfil() = 'administrador');

create policy membros_ver on juri_membros for select to authenticated
  using (exists (select 1 from juris j where j.id = juri_id));
create policy membros_admin on juri_membros for all to authenticated
  using (meu_perfil() = 'administrador') with check (meu_perfil() = 'administrador');

-- Para mudar o código de administrador, execute:
--   update config set valor = 'O-SEU-NOVO-CODIGO' where chave = 'codigo_admin';
