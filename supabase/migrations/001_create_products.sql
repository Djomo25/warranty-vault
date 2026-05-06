-- Table des produits
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  brand           text,
  model           text,
  serial_number   text,
  category        text not null default 'Autre',
  purchase_date   date not null,
  warranty_months integer not null check (warranty_months > 0),
  warranty_end    date generated always as (purchase_date + (warranty_months || ' months')::interval) stored,
  price           numeric(10,2),
  store           text,
  notes           text,
  invoice_url     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index pour les requêtes par utilisateur
create index products_user_id_idx on public.products(user_id);

-- Row Level Security : chaque utilisateur ne voit que ses propres produits
alter table public.products enable row level security;

create policy "Users can manage their own products"
  on public.products
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Mise à jour automatique de updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
