-- A managed category list for the admin catalog. Product.category remains a
-- readable category name, with a foreign key keeping it in sync with this list.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(trim(name)) between 1 and 80)
);

create unique index categories_name_case_insensitive_idx
  on public.categories (lower(trim(name)));

update public.products
set category = case when trim(category) = '' then 'Uncategorized' else trim(category) end
where category <> trim(category) or trim(category) = '';

insert into public.categories (name)
select min(category)
from public.products
group by lower(trim(category))
on conflict (name) do nothing;

update public.products as product
set category = category.name
from public.categories as category
where lower(product.category) = lower(category.name)
  and product.category <> category.name;

alter table public.products
  add constraint products_category_fk
  foreign key (category) references public.categories (name)
  on update cascade on delete restrict;

alter table public.categories enable row level security;

revoke all on table public.categories from anon, authenticated;
grant select, insert, update, delete on table public.categories to authenticated;

create policy categories_admin_read
  on public.categories for select to authenticated
  using ((select private.is_admin()));
create policy categories_admin_insert
  on public.categories for insert to authenticated
  with check ((select private.is_admin()));
create policy categories_admin_update
  on public.categories for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy categories_admin_delete
  on public.categories for delete to authenticated
  using ((select private.is_admin()));
