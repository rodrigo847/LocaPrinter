begin;

insert into auth.users (id) values
  ('937c251a-c18e-4a03-9203-f4da39c9f511'),
  ('937c251a-c18e-4a03-9203-f4da39c9f512');

set local role authenticated;
select set_config('request.jwt.claim.sub', '937c251a-c18e-4a03-9203-f4da39c9f511', true);

insert into public.companies (id, name, cnpj) values
  ('937c251a-c18e-4a03-9203-f4da39c9f513', 'Teste de equipamentos', '12345678000192');
insert into public.clients (id, company_id, type, document, name) values
  ('937c251a-c18e-4a03-9203-f4da39c9f514',
   '937c251a-c18e-4a03-9203-f4da39c9f513', 'PJ', '12345678000192', 'Cliente teste');
insert into public.equipment (
  id, company_id, client_id, name, initial_counter_date, initial_counter,
  price_per_page, loss_percentage
) values
  ('937c251a-c18e-4a03-9203-f4da39c9f515',
   '937c251a-c18e-4a03-9203-f4da39c9f513',
   '937c251a-c18e-4a03-9203-f4da39c9f514',
   'Konica 1', '2025-12-01', 1289204, 0.70, 3),
  ('937c251a-c18e-4a03-9203-f4da39c9f516',
   '937c251a-c18e-4a03-9203-f4da39c9f513',
   '937c251a-c18e-4a03-9203-f4da39c9f514',
   'Konica 2', '2025-12-01', 80000, 0.65, 2);

insert into public.counter_readings (
  company_id, equipment_id, measured_at, current_counter, loss_percentage, price_per_page
) values (
  '937c251a-c18e-4a03-9203-f4da39c9f513',
  '937c251a-c18e-4a03-9203-f4da39c9f515',
  '2025-12-18', 1291727, 3, 0.70
);
insert into public.counter_readings (
  company_id, equipment_id, measured_at, current_counter, loss_percentage, price_per_page
) values (
  '937c251a-c18e-4a03-9203-f4da39c9f513',
  '937c251a-c18e-4a03-9203-f4da39c9f515',
  '2026-02-03', 1293960, 3, 0.70
);

do $$
declare
  first_reading public.counter_readings%rowtype;
  second_reading public.counter_readings%rowtype;
  other_equipment public.equipment%rowtype;
begin
  select * into first_reading from public.counter_readings
  where measured_at = '2025-12-18';
  select * into second_reading from public.counter_readings
  where measured_at = '2026-02-03';
  if first_reading.previous_counter <> 1289204
    or first_reading.current_counter - first_reading.previous_counter <> 2523
    or round((first_reading.current_counter - first_reading.previous_counter)
      * (1 - first_reading.loss_percentage / 100)
      * first_reading.price_per_page, 2) <> 1713.12
  then raise exception 'Cálculo da primeira cobrança falhou'; end if;
  if second_reading.previous_counter <> 1291727
    or second_reading.current_counter - second_reading.previous_counter <> 2233
    or round((second_reading.current_counter - second_reading.previous_counter)
      * (1 - second_reading.loss_percentage / 100)
      * second_reading.price_per_page, 2) <> 1516.21
  then raise exception 'Cálculo da segunda cobrança falhou'; end if;
  select * into other_equipment from public.equipment
  where id = '937c251a-c18e-4a03-9203-f4da39c9f516';
  if other_equipment.client_id <> '937c251a-c18e-4a03-9203-f4da39c9f514' then
    raise exception 'O mesmo cliente não pode possuir vários equipamentos';
  end if;

  begin
    insert into public.counter_readings (
      company_id, equipment_id, measured_at, current_counter, loss_percentage, price_per_page
    ) values (
      '937c251a-c18e-4a03-9203-f4da39c9f513',
      '937c251a-c18e-4a03-9203-f4da39c9f515',
      '2026-02-04', 1290000, 3, 0.70
    );
    raise exception using errcode = 'P0002', message = 'Contador menor que o anterior foi aceito';
  exception when sqlstate 'P0001' then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '937c251a-c18e-4a03-9203-f4da39c9f512', true);
do $$
begin
  if exists (select 1 from public.equipment
    where id = '937c251a-c18e-4a03-9203-f4da39c9f515')
    or exists (select 1 from public.counter_readings
    where equipment_id = '937c251a-c18e-4a03-9203-f4da39c9f515')
  then raise exception 'Outro usuário conseguiu ler dados de equipamentos'; end if;
end;
$$;

rollback;
