create table if not exists projects (
  id bigint primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists assumptions (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
