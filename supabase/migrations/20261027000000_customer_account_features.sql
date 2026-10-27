begin;

alter table public.profiles
  add column phone text,
  add constraint profiles_phone_length check (phone is null or char_length(phone) <= 32);

grant update (display_name, avatar_url, phone) on table public.profiles to authenticated;

create table public.wishlist_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index wishlist_items_owner_created_idx
  on public.wishlist_items (user_id, created_at desc);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state_region text,
  postal_code text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint addresses_label_length check (char_length(label) between 1 and 40),
  constraint addresses_full_name_length check (char_length(full_name) between 1 and 120),
  constraint addresses_phone_length check (char_length(phone) between 1 and 32),
  constraint addresses_line_1_length check (char_length(address_line_1) between 1 and 200),
  constraint addresses_line_2_length check (address_line_2 is null or char_length(address_line_2) <= 200),
  constraint addresses_city_length check (char_length(city) between 1 and 100),
  constraint addresses_state_region_length check (state_region is null or char_length(state_region) <= 100),
  constraint addresses_postal_code_length check (char_length(postal_code) between 1 and 24),
  constraint addresses_country_length check (char_length(country) between 2 and 100)
);

create index addresses_owner_created_idx on public.addresses (user_id, created_at desc);
create unique index addresses_one_default_per_owner_idx on public.addresses (user_id)
  where is_default;

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function private.set_updated_at();

alter table public.wishlist_items enable row level security;
alter table public.addresses enable row level security;

revoke all on table public.wishlist_items, public.addresses from public, anon, authenticated;
grant select, insert, delete on table public.wishlist_items to authenticated;
grant select, insert, delete on table public.addresses to authenticated;
grant update (label, full_name, phone, address_line_1, address_line_2, city, state_region, postal_code, country)
  on table public.addresses to authenticated;

create policy wishlist_items_read_own
  on public.wishlist_items for select to authenticated
  using (user_id = (select auth.uid()));
create policy wishlist_items_insert_own
  on public.wishlist_items for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.products as product
      where product.id = wishlist_items.product_id
        and product.is_published
    )
  );
create policy wishlist_items_delete_own
  on public.wishlist_items for delete to authenticated
  using (user_id = (select auth.uid()));

create policy addresses_read_own
  on public.addresses for select to authenticated
  using (user_id = (select auth.uid()));
create policy addresses_insert_own
  on public.addresses for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy addresses_update_own
  on public.addresses for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy addresses_delete_own
  on public.addresses for delete to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.set_default_address(target_address_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.addresses
  set is_default = false
  where user_id = (select auth.uid())
    and is_default
    and (target_address_id is null or id <> target_address_id);

  if target_address_id is not null then
    update public.addresses
    set is_default = true
    where id = target_address_id
      and user_id = (select auth.uid());

    if not found then
      raise exception 'Address not found for the current user';
    end if;
  end if;
end;
$$;
revoke all on function public.set_default_address(uuid) from public, anon, authenticated;
grant execute on function public.set_default_address(uuid) to authenticated;

commit;
