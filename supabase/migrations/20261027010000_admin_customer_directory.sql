begin;

create policy profiles_admin_read_customers
  on public.profiles for select to authenticated
  using (
    role = 'customer'::public.app_role
    and (select private.is_admin())
  );

commit;
