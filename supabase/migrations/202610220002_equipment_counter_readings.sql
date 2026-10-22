begin;

alter table public.clients
  add constraint clients_company_id_id_key unique (company_id, id);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  client_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 200),
  brand text not null default '',
  model text not null default '',
  serial_number text not null default '',
  initial_counter_date date not null,
  initial_counter bigint not null check (initial_counter >= 0),
  price_per_page numeric(12, 4) not null check (price_per_page >= 0),
  loss_percentage numeric(5, 2) not null default 3
    check (loss_percentage between 0 and 100),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint equipment_client_company_fk
    foreign key (company_id, client_id)
    references public.clients(company_id, id) on delete restrict
);

create unique index equipment_company_serial_number_idx
  on public.equipment(company_id, serial_number)
  where serial_number <> '';
create index equipment_company_name_idx on public.equipment(company_id, name);

create table public.counter_readings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  equipment_id uuid not null,
  measured_at date not null,
  previous_counter bigint not null check (previous_counter >= 0),
  current_counter bigint not null check (current_counter >= previous_counter),
  loss_percentage numeric(5, 2) not null check (loss_percentage between 0 and 100),
  price_per_page numeric(12, 4) not null check (price_per_page >= 0),
  created_at timestamptz not null default now(),
  foreign key (company_id, equipment_id)
    references public.equipment(company_id, id) on delete restrict,
  unique (equipment_id, measured_at)
);

create index counter_readings_company_date_idx
  on public.counter_readings(company_id, measured_at desc);
create index counter_readings_equipment_date_idx
  on public.counter_readings(equipment_id, measured_at desc);

create function public.set_counter_reading_previous()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  baseline bigint;
  last_counter bigint;
  last_date date;
begin
  select e.initial_counter, e.initial_counter_date
    into baseline, last_date
    from public.equipment e
    where e.id = new.equipment_id and e.company_id = new.company_id
    for update;
  if not found then
    raise exception 'Equipamento não encontrado para esta empresa';
  end if;

  select r.current_counter, r.measured_at
    into last_counter, last_date
    from public.counter_readings r
    where r.equipment_id = new.equipment_id
    order by r.measured_at desc
    limit 1;

  if found then
    if new.measured_at <= last_date then
      raise exception 'A data da leitura deve ser posterior à última leitura';
    end if;
    new.previous_counter := last_counter;
  else
    select e.initial_counter_date into last_date
      from public.equipment e
      where e.id = new.equipment_id and e.company_id = new.company_id;
    if new.measured_at < last_date then
      raise exception 'A data da leitura não pode ser anterior ao contador inicial';
    end if;
    new.previous_counter := baseline;
  end if;

  if new.current_counter < new.previous_counter then
    raise exception 'O contador atual não pode ser menor que o anterior';
  end if;
  return new;
end;
$$;

create trigger counter_readings_set_previous
before insert on public.counter_readings
for each row execute function public.set_counter_reading_previous();

create function public.protect_equipment_reading_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.counter_readings r
    where r.equipment_id = old.id
  ) and (
    new.company_id is distinct from old.company_id
    or new.client_id is distinct from old.client_id
    or new.initial_counter_date is distinct from old.initial_counter_date
    or new.initial_counter is distinct from old.initial_counter
  ) then
    raise exception 'Não é possível alterar os dados iniciais após registrar leituras';
  end if;
  return new;
end;
$$;

create trigger equipment_protect_reading_history
before update on public.equipment
for each row execute function public.protect_equipment_reading_history();

create trigger equipment_updated_at before update on public.equipment
for each row execute function public.set_record_updated_at();

alter table public.equipment enable row level security;
alter table public.counter_readings enable row level security;

revoke all on public.equipment, public.counter_readings from anon, authenticated;
grant select, insert, update, delete on public.equipment, public.counter_readings to authenticated;

create policy equipment_company_owner_access on public.equipment
for all to authenticated
using (exists (
  select 1 from public.companies c
  where c.id = equipment.company_id and c.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.companies c
  where c.id = equipment.company_id and c.owner_id = (select auth.uid())
));

create policy counter_readings_company_owner_access on public.counter_readings
for all to authenticated
using (exists (
  select 1 from public.companies c
  where c.id = counter_readings.company_id and c.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.companies c
  where c.id = counter_readings.company_id and c.owner_id = (select auth.uid())
));

commit;
