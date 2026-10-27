alter table public.products
  add column image_urls text[] not null default '{}',
  add constraint products_image_urls_limit check (cardinality(image_urls) <= 10);

update public.products
set image_urls = array[image_url]
where image_url is not null;
