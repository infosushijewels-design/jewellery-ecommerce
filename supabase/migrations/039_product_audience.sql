-- Adds a nullable audience classification to products so the homepage's "For Him" /
-- "For Her" section (and any future men's/women's listing) can filter on real data
-- instead of a keyword search that matches nothing. NULL = unclassified (default for
-- all existing rows); admins assign a value explicitly, nothing is auto-classified.
alter table public.products
  add column if not exists audience text;

alter table public.products
  add constraint products_audience_check
  check (audience is null or audience in ('men', 'women', 'unisex'));

-- Supports the men's/women's listing page queries (WHERE audience = ...).
create index if not exists idx_products_audience
  on public.products (audience)
  where audience is not null;

comment on column public.products.audience is
  'Optional gender/audience classification for the homepage For Him / For Her section: men, women, unisex, or NULL (unclassified).';
