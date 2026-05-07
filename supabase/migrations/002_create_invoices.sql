-- Table des factures liée aux produits
create table public.invoices (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  file_name   text not null,
  file_path   text not null,   -- chemin dans Supabase Storage : {user_id}/{product_id}/{filename}
  file_size   integer,
  mime_type   text,
  created_at  timestamptz not null default now()
);

create index invoices_product_id_idx on public.invoices(product_id);
create index invoices_user_id_idx    on public.invoices(user_id);

alter table public.invoices enable row level security;

create policy "Users can manage their own invoices"
  on public.invoices
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- Supabase Storage : bucket privé + policies
-- ──────────────────────────────────────────────────────────────

-- Créer le bucket (privé)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoices',
  'invoices',
  false,
  10485760,   -- 10 Mo
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Upload : l'utilisateur ne peut écrire que dans son propre dossier
create policy "Users can upload their invoices"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'invoices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lecture : l'utilisateur ne lit que ses propres fichiers
create policy "Users can read their invoices"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'invoices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Suppression : l'utilisateur ne supprime que ses propres fichiers
create policy "Users can delete their invoices"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'invoices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
