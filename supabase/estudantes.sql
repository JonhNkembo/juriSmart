-- JúriSmart AI — estudantes ligados às suas bancas + justificação da escolha de cada júri
-- Executar UMA vez no SQL Editor (depois do perfis.sql). Pode ser repetido sem problemas.

alter table juris add column if not exists estudante_id uuid references perfis(id) on delete set null;
alter table juri_membros add column if not exists justificacao text;
create index if not exists juris_estudante_idx on juris (estudante_id);

-- Liga os júris antigos ao estudante registado com o mesmo nome (só se houver uma correspondência única)
update juris j set estudante_id = p.id
from perfis p
where j.estudante_id is null
  and p.perfil = 'avaliador'
  and lower(trim(p.nome)) = lower(trim(j.estudante))
  and (select count(*) from perfis p2
       where p2.perfil = 'avaliador' and lower(trim(p2.nome)) = lower(trim(j.estudante))) = 1;

-- O estudante passa a ver a sua banca pela ligação (id), e não pelo nome
-- (o nome pode ser editado pelo próprio utilizador, o id não).
drop policy if exists juris_ver on juris;
create policy juris_ver on juris for select to authenticated
  using (meu_perfil() in ('administrador','juri') or estudante_id = auth.uid());
