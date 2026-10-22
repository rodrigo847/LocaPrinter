begin;

insert into auth.users (id) values
  ('937c251a-c18e-4a03-9203-f4da39c9f501'),
  ('937c251a-c18e-4a03-9203-f4da39c9f502');

set local role authenticated;
select set_config('request.jwt.claim.sub', '937c251a-c18e-4a03-9203-f4da39c9f501', true);

insert into public.companies (id, name, cnpj) values
  ('937c251a-c18e-4a03-9203-f4da39c9f503', 'Teste transacional', '12345678000190');
insert into public.clients (id, company_id, type, document, name) values
  ('937c251a-c18e-4a03-9203-f4da39c9f504',
   '937c251a-c18e-4a03-9203-f4da39c9f503', 'PF', '12345678901', 'Cliente de teste');
update public.clients set name = 'Cliente atualizado'
where id = '937c251a-c18e-4a03-9203-f4da39c9f504';

do $$
begin
  if not exists (select 1 from public.clients
    where id = '937c251a-c18e-4a03-9203-f4da39c9f504' and name = 'Cliente atualizado')
  then raise exception 'CRUD do proprietário falhou'; end if;
  begin
    insert into public.clients (company_id, type, document, name) values
      ('937c251a-c18e-4a03-9203-f4da39c9f503', 'PF', '12345678901', 'Duplicado');
    raise exception 'Documento duplicado foi aceito';
  exception when unique_violation then null;
  end;
  begin
    insert into public.clients (company_id, type, document, name) values
      ('937c251a-c18e-4a03-9203-f4da39c9f503', 'PF', '123', 'Inválido');
    raise exception 'Documento inválido foi aceito';
  exception when check_violation then null;
  end;
  begin
    delete from public.companies where id = '937c251a-c18e-4a03-9203-f4da39c9f503';
    raise exception 'Empresa com clientes foi excluída';
  exception when foreign_key_violation then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '937c251a-c18e-4a03-9203-f4da39c9f502', true);
do $$
declare affected integer;
begin
  if exists (select 1 from public.companies where id = '937c251a-c18e-4a03-9203-f4da39c9f503')
    or exists (select 1 from public.clients where id = '937c251a-c18e-4a03-9203-f4da39c9f504')
  then raise exception 'Outro usuário conseguiu ler dados'; end if;
  update public.clients set name = 'Invasor' where id = '937c251a-c18e-4a03-9203-f4da39c9f504';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Outro usuário alterou dados'; end if;
  delete from public.clients where id = '937c251a-c18e-4a03-9203-f4da39c9f504';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Outro usuário excluiu dados'; end if;
  begin
    insert into public.clients (company_id, type, document, name) values
      ('937c251a-c18e-4a03-9203-f4da39c9f503', 'PF', '12345678902', 'Invasor');
    raise exception 'Outro usuário inseriu dados';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.companies (owner_id, name, cnpj) values
      ('937c251a-c18e-4a03-9203-f4da39c9f501', 'Invasor', '12345678000191');
    raise exception 'Proprietário falsificado foi aceito';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform * from public.clients;
    raise exception 'Anônimo conseguiu ler clientes';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.companies;
    raise exception 'Anônimo conseguiu ler empresas';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '937c251a-c18e-4a03-9203-f4da39c9f501', true);
delete from public.clients where id = '937c251a-c18e-4a03-9203-f4da39c9f504';
delete from public.companies where id = '937c251a-c18e-4a03-9203-f4da39c9f503';
rollback;
