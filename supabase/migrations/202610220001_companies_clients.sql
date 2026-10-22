begin;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 200),
  cnpj text not null check (cnpj ~ '^[0-9]{14}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, cnpj)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  type text not null check (type in ('PF', 'PJ')),
  document text not null,
  name text not null check (length(btrim(name)) between 1 and 200),
  email text not null default '',
  phone text not null default '',
  street text not null default '',
  number text not null default '',
  complement text not null default '',
  neighborhood text not null default '',
  city text not null default '',
  state text not null default '' check (state = '' or state ~ '^[A-Z]{2}$'),
  zip_code text not null default '' check (zip_code = '' or zip_code ~ '^[0-9]{8}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type = 'PF' and document ~ '^[0-9]{11}$')
    or (type = 'PJ' and document ~ '^[0-9]{14}$')),
  unique (company_id, document)
);

create index clients_company_name_idx on public.clients(company_id, name);

create function public.set_record_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at before update on public.companies
for each row execute function public.set_record_updated_at();
create trigger clients_updated_at before update on public.clients
for each row execute function public.set_record_updated_at();

alter table public.companies enable row level security;
alter table public.clients enable row level security;

revoke all on public.companies, public.clients from anon, authenticated;
grant select, insert, update, delete on public.companies, public.clients to authenticated;

create policy companies_owner_access on public.companies
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy clients_company_owner_access on public.clients
for all to authenticated
using (exists (
  select 1 from public.companies c
  where c.id = clients.company_id and c.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.companies c
  where c.id = clients.company_id and c.owner_id = (select auth.uid())
));

commit;
