-- JúriSmart AI — executar no SQL Editor do Supabase
create table docentes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text unique not null,
  grau text not null,
  nivel text not null check (nivel in ('Doutorado','Mestrado','Licenciatura')),
  especialidades text[] not null default '{}',
  disponivel boolean not null default true,
  created_at timestamptz default now()
);
create table curriculo_itens (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references docentes(id) on delete cascade,
  categoria text not null check (categoria in ('formacao','publicacoes','projectos','orientacoes','conferencias','livros','citacoes','premios')),
  titulo text not null,
  ano int,
  created_at timestamptz default now()
);
create table juris (
  id uuid primary key default gen_random_uuid(),
  tema text not null,
  palavras_chave text[] not null default '{}',
  estudante text not null,
  orientador_id uuid not null references docentes(id),
  data_hora timestamptz not null,
  modo text not null check (modo in ('auto','manual')),
  created_at timestamptz default now()
);
create table juri_membros (
  id uuid primary key default gen_random_uuid(),
  juri_id uuid not null references juris(id) on delete cascade,
  docente_id uuid not null references docentes(id),
  papel text not null check (papel in ('presidente','vogal1','vogal2','suplente')),
  compatibilidade int,
  unique (juri_id, papel),
  unique (juri_id, docente_id)
);
create index on curriculo_itens (docente_id);
create index on juris (data_hora);

alter table docentes enable row level security;
alter table curriculo_itens enable row level security;
alter table juris enable row level security;
alter table juri_membros enable row level security;

-- Acesso apenas para utilizadores autenticados (Supabase Auth).
create policy auth_all on docentes for all to authenticated using (true) with check (true);
create policy auth_all on curriculo_itens for all to authenticated using (true) with check (true);
create policy auth_all on juris for all to authenticated using (true) with check (true);
create policy auth_all on juri_membros for all to authenticated using (true) with check (true);

-- Dados de exemplo
insert into docentes (id, nome, email, grau, nivel, especialidades) values
 ('00000000-0000-0000-0000-000000000001','Dr. Carlos Eduardo','carlos.eduardo@universidade.edu','Doutor em Inteligência Artificial','Doutorado','{Inteligência Artificial,Deep Learning,Visão Computacional}'),
 ('00000000-0000-0000-0000-000000000002','Dra. Ana Paulo','ana.paulo@universidade.edu','Doutora em Engenharia de Software','Doutorado','{Engenharia de Software,Web,Qualidade de Software}'),
 ('00000000-0000-0000-0000-000000000003','Msc. Bento Kiala','bento.kiala@universidade.edu','Mestre em Cibersegurança','Mestrado','{Cibersegurança,Redes,Criptografia}'),
 ('00000000-0000-0000-0000-000000000004','Dr. Manuel Sambo','manuel.sambo@universidade.edu','Doutor em Sistemas Distribuídos','Doutorado','{Sistemas Distribuídos,Nuvem,Bases de Dados}'),
 ('00000000-0000-0000-0000-000000000005','Msc. Rosa Mendes','rosa.mendes@universidade.edu','Mestre em Ciência de Dados','Mestrado','{Dados,Machine Learning,Estatística}'),
 ('00000000-0000-0000-0000-000000000006','Lic. Joaquim Neto','joaquim.neto@universidade.edu','Licenciado em Informática','Licenciatura','{Redes,Web,Sistemas de Informação}');
insert into curriculo_itens (docente_id, categoria, titulo, ano) values
 ('00000000-0000-0000-0000-000000000001','publicacoes','Deep Learning no diagnóstico por imagem médica',2023),
 ('00000000-0000-0000-0000-000000000001','orientacoes','Reconhecimento de padrões em imagens',2022),
 ('00000000-0000-0000-0000-000000000002','projectos','Plataforma web para gestão académica',2024),
 ('00000000-0000-0000-0000-000000000003','publicacoes','Segurança em redes sem fios',2021),
 ('00000000-0000-0000-0000-000000000005','publicacoes','Machine Learning aplicado à saúde pública',2024);

-- Depois de executar este ficheiro, execute também supabase/perfis.sql (perfis e privilégios).
