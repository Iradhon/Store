begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.app_role as enum ('customer', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) <= 120)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null default '',
  image_url text,
  price_minor bigint not null check (price_minor > 0 and price_minor <= 1000000000000),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  inventory_quantity integer not null default 0 check (inventory_quantity >= 0),
  is_published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_length check (char_length(name) between 1 and 200),
  constraint products_category_length check (char_length(category) between 1 and 80),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  shipping_address jsonb not null,
  shipping_method text,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  payment_status text not null default 'not_configured'
    check (payment_status in ('not_configured', 'pending', 'authorized', 'paid', 'failed', 'cancelled', 'refunded')),
  fulfillment_status text not null default 'unfulfilled'
    check (fulfillment_status in ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_provider text,
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_address_is_object check (jsonb_typeof(shipping_address) = 'object'),
  constraint orders_amounts_valid check (
    subtotal_minor between 0 and 1000000000000
    and shipping_minor between 0 and 1000000000000
    and discount_minor between 0 and subtotal_minor
    and tax_minor between 0 and 1000000000000
    and total_minor between 0 and 1000000000000
    and total_minor = subtotal_minor - discount_minor + shipping_minor + tax_minor
  ),
  constraint orders_provider_reference_unique unique (payment_provider, provider_reference)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  product_sku text,
  product_image_url text,
  quantity integer not null check (quantity between 1 and 99),
  unit_price_minor bigint not null check (unit_price_minor between 0 and 1000000000000),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now()
);

create index products_public_catalog_idx on public.products (category, created_at desc)
  where is_published;
create index orders_owner_created_idx on public.orders (user_id, created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id) where product_id is not null;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'admin'::public.app_role
  );
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(pg_catalog.left(pg_catalog.btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), '')
  );
  return new;
end;
$$;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger products_set_updated_at
  before update on public.products
  for each row execute function private.set_updated_at();
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.profiles, public.products, public.orders, public.order_items
  from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url) on table public.profiles to authenticated;
grant select on table public.orders, public.order_items to authenticated;
grant insert, update, delete on table public.products to authenticated;

create policy profiles_read_own
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_own
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy products_read_published
  on public.products for select to anon, authenticated
  using (is_published);
create policy products_admin_read_all
  on public.products for select to authenticated
  using ((select private.is_admin()));
create policy products_admin_insert
  on public.products for insert to authenticated
  with check ((select private.is_admin()));
create policy products_admin_update
  on public.products for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy products_admin_delete
  on public.products for delete to authenticated
  using ((select private.is_admin()));

create policy orders_read_owner
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()));
create policy orders_admin_read
  on public.orders for select to authenticated
  using ((select private.is_admin()));

create policy order_items_read_owner
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders as parent_order
      where parent_order.id = order_items.order_id
        and parent_order.user_id = (select auth.uid())
    )
  );
create policy order_items_admin_read
  on public.order_items for select to authenticated
  using ((select private.is_admin()));

alter default privileges in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

commit;
