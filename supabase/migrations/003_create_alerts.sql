-- Table pour tracer les alertes email envoyées et éviter les doublons
create table if not exists public.alerts (
  id          uuid        default gen_random_uuid() primary key,
  product_id  uuid        not null references public.products(id) on delete cascade,
  user_id     uuid        not null,
  alert_type  text        not null default '30_days',
  sent_at     timestamptz default now() not null
);

create index on public.alerts (product_id, alert_type, sent_at);

alter table public.alerts enable row level security;

create policy "users can read own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);
