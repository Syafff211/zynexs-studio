-- =====================================================================
--  ZYNEX STUDIO — Premium Digital Products & Services
--  Full database schema for Supabase PostgreSQL
--  Run this ENTIRE file in: Supabase Dashboard → SQL Editor → New query
--  Safe to re-run (idempotent).
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- =====================================================================
--  ENUM TYPES
-- =====================================================================
do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'paid', 'processing', 'completed', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.discount_type as enum ('fixed', 'percentage');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('unpaid', 'awaiting_confirmation', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- =====================================================================
--  UTILITY: updated_at trigger
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
--  PROFILES
-- =====================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       citext,
  phone       text,
  avatar_url  text,
  role        public.user_role not null default 'user',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (email);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by RLS policies. SECURITY DEFINER avoids recursive RLS
-- evaluation when checking the caller's role from within a policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon, service_role;

-- Users must never be able to escalate their own role or reactivate
-- themselves. Enforced at the database level, not just in the app.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role (server-side admin client) bypasses this guard.
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
  elsif new.id = auth.uid() then
    -- An admin cannot demote or deactivate themselves by accident.
    new.role := old.role;
    new.is_active := old.is_active;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- =====================================================================
--  CATEGORIES
-- =====================================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon        text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists categories_active_idx on public.categories (is_active, sort_order);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- =====================================================================
--  PRODUCTS
-- =====================================================================
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  short_description text,
  description       text,
  category_id       uuid references public.categories(id) on delete set null,
  price             integer not null default 0 check (price >= 0),      -- IDR, no decimals
  compare_at_price  integer check (compare_at_price is null or compare_at_price >= 0),
  duration          text,                                                -- "1 Tahun", "18 Bulan"
  image_url         text,
  icon              text,                                                -- lucide icon name fallback
  badge             text,                                                -- "Best Seller", "Promo"
  features          text[] not null default '{}',
  requirements      text[] not null default '{}',
  faqs              jsonb not null default '[]'::jsonb,                  -- [{question, answer}]
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  is_custom_price   boolean not null default false,                      -- "Dikelola admin"
  stock             integer,                                             -- null = unlimited
  sort_order        integer not null default 0,
  sold_count        integer not null default 0 check (sold_count >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_active_idx   on public.products (is_active);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_featured_idx on public.products (is_featured) where is_featured;
create index if not exists products_slug_idx     on public.products (slug);
create index if not exists products_price_idx    on public.products (price);
create index if not exists products_search_idx   on public.products
  using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(short_description, '')));

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =====================================================================
--  PROMO CODES
-- =====================================================================
create table if not exists public.promo_codes (
  id               uuid primary key default gen_random_uuid(),
  code             text not null,
  description      text,
  discount_type    public.discount_type not null default 'fixed',
  discount_value   integer not null check (discount_value > 0),
  max_discount     integer check (max_discount is null or max_discount > 0), -- cap for percentage
  min_purchase     integer not null default 0 check (min_purchase >= 0),
  max_redemptions  integer check (max_redemptions is null or max_redemptions > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  expires_at       timestamptz,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint promo_codes_code_upper_ck check (code = upper(code)),
  constraint promo_codes_percentage_ck check (
    discount_type <> 'percentage' or (discount_value > 0 and discount_value <= 100)
  ),
  constraint promo_codes_redemption_ck check (
    max_redemptions is null or redemption_count <= max_redemptions
  )
);

create unique index if not exists promo_codes_code_key on public.promo_codes (upper(code));
create index if not exists promo_codes_active_idx on public.promo_codes (is_active, expires_at);

drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at
  before update on public.promo_codes
  for each row execute function public.set_updated_at();

-- =====================================================================
--  ORDERS
-- =====================================================================
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  order_number   text not null unique,
  user_id        uuid references public.profiles(id) on delete set null,
  customer_name  text not null,
  customer_email citext not null,
  customer_phone text not null,
  subtotal       integer not null default 0 check (subtotal >= 0),
  discount       integer not null default 0 check (discount >= 0),
  total          integer not null default 0 check (total >= 0),
  promo_id       uuid references public.promo_codes(id) on delete set null,
  promo_code     text,
  status         public.order_status not null default 'pending',
  notes          text,
  admin_notes    text,
  whatsapp_url   text,
  idempotency_key text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint orders_total_ck check (total = greatest(subtotal - discount, 0))
);

create index if not exists orders_user_idx    on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx  on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_number_idx  on public.orders (order_number);
create unique index if not exists orders_idempotency_key_uidx
  on public.orders (idempotency_key) where idempotency_key is not null;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- =====================================================================
--  ORDER ITEMS  (price/name snapshotted at purchase time)
-- =====================================================================
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text,
  price        integer not null check (price >= 0),
  quantity     integer not null check (quantity > 0),
  subtotal     integer not null check (subtotal >= 0),
  duration     text,
  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_idx   on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- =====================================================================
--  PROMO REDEMPTIONS
-- =====================================================================
create table if not exists public.promo_redemptions (
  id          uuid primary key default gen_random_uuid(),
  promo_id    uuid not null references public.promo_codes(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  order_id    uuid references public.orders(id) on delete set null,
  guest_email citext,
  amount      integer not null default 0 check (amount >= 0),
  redeemed_at timestamptz not null default now(),
  constraint promo_redemptions_identity_ck check (user_id is not null or guest_email is not null)
);

-- One account may use a given promo code exactly once.
create unique index if not exists promo_redemptions_promo_user_uidx
  on public.promo_redemptions (promo_id, user_id) where user_id is not null;
-- Guests are limited per e-mail address.
create unique index if not exists promo_redemptions_promo_guest_uidx
  on public.promo_redemptions (promo_id, guest_email) where user_id is null;

create index if not exists promo_redemptions_user_idx  on public.promo_redemptions (user_id, redeemed_at desc);
create index if not exists promo_redemptions_promo_idx on public.promo_redemptions (promo_id);

-- =====================================================================
--  PAYMENTS
-- =====================================================================
create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  method      text not null default 'whatsapp',
  amount      integer not null check (amount >= 0),
  status      public.payment_status not null default 'unpaid',
  reference   text,
  paid_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists payments_order_idx  on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (status);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- =====================================================================
--  SITE SETTINGS  (landing page CMS — single row, key "global")
-- =====================================================================
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- =====================================================================
--  FAQS
-- =====================================================================
create table if not exists public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  category   text not null default 'Umum',
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_active_idx on public.faqs (is_active, sort_order);

drop trigger if exists faqs_set_updated_at on public.faqs;
create trigger faqs_set_updated_at
  before update on public.faqs
  for each row execute function public.set_updated_at();

-- =====================================================================
--  ANNOUNCEMENTS
-- =====================================================================
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  link_url   text,
  link_label text,
  variant    text not null default 'info',
  is_active  boolean not null default true,
  starts_at  timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_active_idx on public.announcements (is_active, expires_at);

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- =====================================================================
--  ORDER NUMBER GENERATOR  →  ZYN-YYYYMMDD-0001
--  Uses a per-day sequence table with row locking so concurrent
--  checkouts can never produce a duplicate number.
-- =====================================================================
create table if not exists public.order_counters (
  day        date primary key,
  last_value integer not null default 0
);

create or replace function public.next_order_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'Asia/Jakarta')::date;
  v_next integer;
begin
  insert into public.order_counters (day, last_value)
  values (v_day, 1)
  on conflict (day) do update
    set last_value = public.order_counters.last_value + 1
  returning last_value into v_next;

  return 'ZYN-' || to_char(v_day, 'YYYYMMDD') || '-' || lpad(v_next::text, 4, '0');
end;
$$;

revoke all on function public.next_order_number() from public;
grant execute on function public.next_order_number() to service_role;

-- =====================================================================
--  PROMO VALIDATION  (read-only, safe for anon)
--  Returns the promo row plus a machine-readable status code.
-- =====================================================================
create or replace function public.validate_promo_code(
  p_code    text,
  p_user_id uuid default null,
  p_email   text default null
)
returns table (
  status         text,
  promo_id       uuid,
  code           text,
  discount_type  public.discount_type,
  discount_value integer,
  max_discount   integer,
  min_purchase   integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v promo_codes%rowtype;
  v_used boolean := false;
begin
  select * into v from public.promo_codes p where upper(p.code) = upper(trim(p_code)) limit 1;

  if not found then
    return query select 'invalid'::text, null::uuid, null::text, null::public.discount_type, null::integer, null::integer, null::integer;
    return;
  end if;

  if not v.is_active then
    return query select 'inactive'::text, v.id, v.code, v.discount_type, v.discount_value, v.max_discount, v.min_purchase;
    return;
  end if;

  if v.expires_at is not null and v.expires_at <= now() then
    return query select 'expired'::text, v.id, v.code, v.discount_type, v.discount_value, v.max_discount, v.min_purchase;
    return;
  end if;

  if v.max_redemptions is not null and v.redemption_count >= v.max_redemptions then
    return query select 'limit_reached'::text, v.id, v.code, v.discount_type, v.discount_value, v.max_discount, v.min_purchase;
    return;
  end if;

  if p_user_id is not null then
    select exists (
      select 1 from public.promo_redemptions r
      where r.promo_id = v.id and r.user_id = p_user_id
    ) into v_used;
  elsif p_email is not null and length(trim(p_email)) > 0 then
    select exists (
      select 1 from public.promo_redemptions r
      where r.promo_id = v.id and r.guest_email = lower(trim(p_email))
    ) into v_used;
  end if;

  if v_used then
    return query select 'already_used'::text, v.id, v.code, v.discount_type, v.discount_value, v.max_discount, v.min_purchase;
    return;
  end if;

  return query select 'valid'::text, v.id, v.code, v.discount_type, v.discount_value, v.max_discount, v.min_purchase;
end;
$$;

grant execute on function public.validate_promo_code(text, uuid, text) to anon, authenticated, service_role;

-- =====================================================================
--  ATOMIC PROMO REDEMPTION
--  Called inside checkout. Locks the promo row (FOR UPDATE) so two
--  concurrent checkouts cannot exceed max_redemptions, and relies on the
--  UNIQUE(promo_id, user_id) index to reject a second use by one account.
-- =====================================================================
create or replace function public.redeem_promo(
  p_promo_id uuid,
  p_user_id  uuid,
  p_order_id uuid,
  p_email    text,
  p_amount   integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v promo_codes%rowtype;
begin
  -- Serialise concurrent redemptions of the same promo.
  select * into v from public.promo_codes where id = p_promo_id for update;

  if not found then
    return 'invalid';
  end if;

  if not v.is_active then
    return 'inactive';
  end if;

  if v.expires_at is not null and v.expires_at <= now() then
    return 'expired';
  end if;

  if v.max_redemptions is not null and v.redemption_count >= v.max_redemptions then
    return 'limit_reached';
  end if;

  begin
    insert into public.promo_redemptions (promo_id, user_id, order_id, guest_email, amount)
    values (
      p_promo_id,
      p_user_id,
      p_order_id,
      case when p_user_id is null then lower(nullif(trim(p_email), '')) else null end,
      greatest(coalesce(p_amount, 0), 0)
    );
  exception when unique_violation then
    return 'already_used';
  end;

  update public.promo_codes
     set redemption_count = redemption_count + 1
   where id = p_promo_id;

  return 'ok';
end;
$$;

revoke all on function public.redeem_promo(uuid, uuid, uuid, text, integer) from public;
grant execute on function public.redeem_promo(uuid, uuid, uuid, text, integer) to service_role;

-- Nobody but the database may bump redemption_count arbitrarily.
create or replace function public.protect_redemption_count()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and auth.uid() is not null
     and new.redemption_count <> old.redemption_count then
    new.redemption_count := old.redemption_count;
  end if;
  return new;
end;
$$;

drop trigger if exists promo_codes_protect_count on public.promo_codes;
create trigger promo_codes_protect_count
  before update on public.promo_codes
  for each row execute function public.protect_redemption_count();

-- =====================================================================
--  SOLD COUNTER (server-side only)
-- =====================================================================
create or replace function public.increment_sold_count(p_product_id uuid, p_qty integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products
     set sold_count = sold_count + greatest(coalesce(p_qty, 0), 0)
   where id = p_product_id;
$$;

revoke all on function public.increment_sold_count(uuid, integer) from public;
grant execute on function public.increment_sold_count(uuid, integer) to service_role;

-- =====================================================================
--  ADMIN DASHBOARD STATS
-- =====================================================================
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'total_revenue',     coalesce((select sum(total) from public.orders where status in ('paid','processing','completed')), 0),
    'pending_revenue',   coalesce((select sum(total) from public.orders where status = 'pending'), 0),
    'total_orders',      (select count(*) from public.orders),
    'pending_orders',    (select count(*) from public.orders where status = 'pending'),
    'processing_orders', (select count(*) from public.orders where status = 'processing'),
    'completed_orders',  (select count(*) from public.orders where status = 'completed'),
    'cancelled_orders',  (select count(*) from public.orders where status = 'cancelled'),
    'total_users',       (select count(*) from public.profiles),
    'active_products',   (select count(*) from public.products where is_active),
    'total_products',    (select count(*) from public.products),
    'active_promos',     (select count(*) from public.promo_codes where is_active
                            and (expires_at is null or expires_at > now())
                            and (max_redemptions is null or redemption_count < max_redemptions)),
    'total_redemptions', (select count(*) from public.promo_redemptions)
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated, service_role;

-- =====================================================================
--  ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.promo_codes       enable row level security;
alter table public.promo_redemptions enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.payments          enable row level security;
alter table public.site_settings     enable row level security;
alter table public.faqs              enable row level security;
alter table public.announcements     enable row level security;
alter table public.order_counters    enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles_select_own"   on public.profiles;
drop policy if exists "profiles_update_own"   on public.profiles;
drop policy if exists "profiles_admin_select" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- categories (public read, admin write) ----------
drop policy if exists "categories_public_read" on public.categories;
drop policy if exists "categories_admin_all"   on public.categories;

create policy "categories_public_read" on public.categories
  for select using (is_active or public.is_admin());

create policy "categories_admin_all" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- products (public read of active, admin write) ----------
drop policy if exists "products_public_read" on public.products;
drop policy if exists "products_admin_all"   on public.products;

create policy "products_public_read" on public.products
  for select using (is_active or public.is_admin());

create policy "products_admin_all" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- promo_codes ----------
-- Codes are NOT publicly listable: validation happens through the
-- SECURITY DEFINER function above so nobody can enumerate active codes.
drop policy if exists "promo_codes_admin_all" on public.promo_codes;
create policy "promo_codes_admin_all" on public.promo_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- promo_redemptions ----------
drop policy if exists "promo_redemptions_select_own" on public.promo_redemptions;
drop policy if exists "promo_redemptions_admin_all"  on public.promo_redemptions;

create policy "promo_redemptions_select_own" on public.promo_redemptions
  for select using (auth.uid() = user_id);

create policy "promo_redemptions_admin_all" on public.promo_redemptions
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- orders (read own; writes are server-side only) ----------
drop policy if exists "orders_select_own"  on public.orders;
drop policy if exists "orders_admin_all"   on public.orders;

create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

create policy "orders_admin_all" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- order_items ----------
drop policy if exists "order_items_select_own" on public.order_items;
drop policy if exists "order_items_admin_all"  on public.order_items;

create policy "order_items_select_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "order_items_admin_all" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- payments ----------
drop policy if exists "payments_select_own" on public.payments;
drop policy if exists "payments_admin_all"  on public.payments;

create policy "payments_select_own" on public.payments
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "payments_admin_all" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- site_settings / faqs / announcements ----------
drop policy if exists "site_settings_public_read" on public.site_settings;
drop policy if exists "site_settings_admin_all"   on public.site_settings;

create policy "site_settings_public_read" on public.site_settings for select using (true);
create policy "site_settings_admin_all"   on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "faqs_public_read" on public.faqs;
drop policy if exists "faqs_admin_all"   on public.faqs;

create policy "faqs_public_read" on public.faqs for select using (is_active or public.is_admin());
create policy "faqs_admin_all"   on public.faqs
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "announcements_public_read" on public.announcements;
drop policy if exists "announcements_admin_all"   on public.announcements;

create policy "announcements_public_read" on public.announcements
  for select using (
    (is_active and starts_at <= now() and (expires_at is null or expires_at > now()))
    or public.is_admin()
  );
create policy "announcements_admin_all" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- order_counters: no policies at all → only service_role can touch it.

-- =====================================================================
--  STORAGE BUCKETS + POLICIES
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "public_read_product_images" on storage.objects;
create policy "public_read_product_images" on storage.objects
  for select using (bucket_id in ('product-images', 'site-assets', 'avatars'));

drop policy if exists "admin_write_product_images" on storage.objects;
create policy "admin_write_product_images" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'site-assets') and public.is_admin());

drop policy if exists "admin_update_product_images" on storage.objects;
create policy "admin_update_product_images" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin());

drop policy if exists "admin_delete_product_images" on storage.objects;
create policy "admin_delete_product_images" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin());

-- Users manage their own avatar under a folder named after their uid.
drop policy if exists "users_write_own_avatar" on storage.objects;
create policy "users_write_own_avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users_update_own_avatar" on storage.objects;
create policy "users_update_own_avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users_delete_own_avatar" on storage.objects;
create policy "users_delete_own_avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
--  DONE
-- =====================================================================
