begin;

alter table public.counter_readings
  drop constraint counter_readings_company_id_equipment_id_fkey;

alter table public.counter_readings
  add constraint counter_readings_equipment_company_fk
  foreign key (company_id, equipment_id)
  references public.equipment(company_id, id)
  on delete cascade;

commit;
