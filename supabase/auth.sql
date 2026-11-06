-- Migração: só utilizadores com sessão iniciada acedem aos dados.
-- Executar UMA vez no SQL Editor (as tabelas já existem).
drop policy if exists dev_all on docentes;
drop policy if exists dev_all on curriculo_itens;
drop policy if exists dev_all on juris;
drop policy if exists dev_all on juri_membros;

create policy auth_all on docentes for all to authenticated using (true) with check (true);
create policy auth_all on curriculo_itens for all to authenticated using (true) with check (true);
create policy auth_all on juris for all to authenticated using (true) with check (true);
create policy auth_all on juri_membros for all to authenticated using (true) with check (true);
