# Zynex Studio

**Premium Digital Products & Services** — a production-ready Indonesian digital store built with Next.js App Router, TypeScript, Tailwind CSS v4 and Supabase.

Not a mockup: every feature is backed by a real Postgres database with Row Level Security, server-side price validation, race-safe promo redemption, and WhatsApp checkout.

---

## Table of contents

- [Feature overview](#feature-overview)
- [Tech stack](#tech-stack)
- [Setup — 10 steps](#setup--10-steps)
- [Project structure](#project-structure)
- [How the critical flows work](#how-the-critical-flows-work)
- [Security model](#security-model)
- [Deploying to Vercel](#deploying-to-vercel)
- [Troubleshooting](#troubleshooting)

---

## Feature overview

### Storefront

| Route | Description |
| --- | --- |
| `/` | Landing page. Hero, stats, benefits, featured products, promo banner, "cara order", CTA — **all copy is editable from the admin CMS**, no source edits required. |
| `/store` | Catalog with category filter, search, sorting and pagination (server-rendered). |
| `/store/[slug]` | Product detail: features, requirements, per-product FAQ, related products, dynamic SEO metadata + `Product` JSON-LD structured data. |
| `/promo` | Live list of active promo codes with remaining-quota indicator. |
| `/cart` | Client cart (localStorage) with quantity controls. |
| `/checkout` | Server-validated quote + promo, then WhatsApp handoff. |
| `/login`, `/register` | Supabase email/password auth. |
| `/account` | Profile, stats, edit name/WhatsApp. |
| `/account/orders`, `/account/orders/[id]` | Order history and detail with item snapshots. |
| `/faq` | FAQ accordion, grouped by category, managed from admin. |

### Admin (`/admin`)

Protected by **middleware + a server-side role check in the admin layout + RLS policies on every table**. Hiding the menu is not the protection.

| Route | Description |
| --- | --- |
| `/admin` | Dashboard: revenue, orders, customers, conversion, 14-day revenue chart, recent orders, top products. |
| `/admin/products` | Full CRUD, image upload to Supabase Storage, categories CRUD, featured/badge toggles, active toggle, custom-price products. |
| `/admin/promo` | Promo CRUD (fixed & percentage), min purchase, max discount, max redemptions, validity window, live `3 / 3 Redeemed` **FULL** state, redemption history per code. |
| `/admin/orders` | Search, status filter, status change (auto-syncs the payment record), "Chat Customer" WhatsApp deep link, order detail page. |
| `/admin/users` | Search, role management, activate/deactivate, spend/order/redemption aggregates. **Self-escalation and self-deactivation are blocked in the UI, in the server action, and by a database trigger.** |
| `/admin/content` | FAQ CRUD (with sort order) and announcement bar CRUD (info/promo/warning variants, expiry). |
| `/admin/settings` | Landing-page CMS: hero, stats, benefits, promo banner, footer, WhatsApp number, support email, social links. |

### Cross-cutting

Loading skeletons, empty states, error boundaries, toasts, confirm dialogs, mobile-first responsive layout (admin tables collapse to cards — no horizontal scrolling), keyboard-accessible modals with focus trapping, `sitemap.xml`, `robots.txt`, a generated Open Graph image, and security headers.

---

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack)
- **TypeScript** in `strict` mode
- **Tailwind CSS v4** with a custom design-token layer in `src/app/globals.css`
- **Supabase** — Postgres, Auth, Storage, RLS, PL/pgSQL functions
- **Zod** for input validation
- **lucide-react** for icons
- No UI kit and no chart library — every component is hand-built (the revenue chart is hand-rolled SVG).

---

## Setup — 10 steps

> Requirements: **Node.js 20+** (22 recommended) and npm. No Docker needed.

### Step 1 — Install dependencies

```bash
cd zynex-studio
npm install
```

### Step 2 — Create a Supabase project

1. Go to <https://supabase.com> and sign in.
2. **New project** → pick a name (e.g. `zynex-studio`), a strong database password, and the region closest to your users (**Southeast Asia (Singapore)** is best for Indonesia).
3. Wait ~2 minutes for provisioning.

### Step 3 — Run the database schema

1. In your Supabase project open **SQL Editor → New query**.
2. Copy the **entire** contents of [`supabase/schema.sql`](./supabase/schema.sql) and paste it in.
3. Click **Run**.

This one script is idempotent (safe to re-run) and creates:

- **Tables** — `profiles`, `categories`, `products`, `promo_codes`, `promo_redemptions`, `orders`, `order_items`, `payments`, `site_settings`, `faqs`, `announcements`, `order_counters`
- **Enums** — `user_role`, `order_status`, `payment_status`, `discount_type`, `announcement_variant`
- **Functions** — `is_admin()`, `next_order_number()`, `validate_promo_code()`, `redeem_promo()`, `increment_sold_count()`, `admin_dashboard_stats()`
- **Triggers** — `set_updated_at`, `handle_new_user` (auto-creates a profile on signup), `protect_profile_privileges` (blocks self role/status changes), `protect_redemption_count` (blocks client-side tampering)
- **RLS policies** on every table
- **Storage buckets** — `product-images`, `avatars`, `site-assets`
- **Indexes** on every column used for filtering, sorting or joining

### Step 4 — Copy your API keys

In Supabase go to **Project Settings → API** and copy:

| Supabase field | Env variable |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ The `service_role` key bypasses RLS. It must **never** be prefixed with `NEXT_PUBLIC_`, committed to git, or shipped to the browser. In this codebase it is only readable through `serviceRoleKey()` in `src/lib/env.ts`, which throws if it is ever reached from client code.

### Step 5 — Create `.env.local`

```bash
cp .env.example .env.local
```

Then fill it in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=6285141308100
```

`.env.local` is already git-ignored.

### Step 6 — Seed the starter data

```bash
npm run seed
```

This is idempotent — run it as often as you like. It inserts:

- **4 categories** — Domain, AI, Design, Social Media
- **7 products**

  | Product | Price | Duration |
  | --- | --- | --- |
  | Domain .my.id | Rp5.000 | 1 Tahun |
  | Domain .web.id | Rp5.000 | 1 Tahun |
  | Domain .biz.id | Rp5.000 | 1 Tahun |
  | Google AI Pro (Head) | Rp30.000 | 18 Bulan |
  | Google AI Pro (Invite) | Rp20.000 | 18 Bulan |
  | Canva Pro | Rp2.000 | 1 Bulan |
  | Suntik All Sosmed | Dikelola admin | — |

- **3 promo codes** — `PROMOZYN` (Rp10.000 off, min Rp20.000, max **3** redemptions), `ZYNEX20` (20% off, max Rp15.000, 50 redemptions), `HEMAT2K` (Rp2.000 off, 100 redemptions)
- **8 FAQs**, **1 announcement**, and the default `site_settings` row

All of it is editable from the admin panel afterwards — nothing is hardcoded in the source.

### Step 7 — Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>. If the environment variables are missing or wrong, the site still renders and shows a clear **"Supabase belum dikonfigurasi"** setup card instead of crashing.

### Step 8 — Register your account

Go to <http://localhost:3000/register> and sign up with the email you want to use as the administrator. The `handle_new_user` trigger creates the matching `profiles` row automatically with the `customer` role.

> If Supabase asks for email confirmation and you would rather skip it while developing: **Authentication → Sign In / Providers → Email → disable "Confirm email"**.

### Step 9 — Promote yourself to admin

Either add the email to `.env.local` and re-run the seeder:

```env
SEED_ADMIN_EMAIL=you@email.com
```

```bash
npm run seed
```

…or run this once in the Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@email.com';
```

Sign out and back in, then open <http://localhost:3000/admin>. A non-admin session hitting `/admin` is redirected by `middleware.ts` *and* rejected again by the admin layout server-side.

### Step 10 — Verify the build

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm run build       # must complete with no errors
```

Then walk through the acceptance path: add a product to the cart → `/checkout` → apply `PROMOZYN` → place the order → confirm WhatsApp opens with the generated message → check the order in `/account/orders` and `/admin/orders`.

---

## Project structure

```
zynex-studio/
├── middleware.ts                 → session refresh + /admin & /account gating
├── next.config.ts                → image remote patterns, security headers
├── supabase/
│   └── schema.sql                → the whole database: tables, RLS, functions, triggers, buckets
├── scripts/
│   └── seed.ts                   → idempotent seeder (npm run seed)
└── src/
    ├── app/
    │   ├── (storefront)/         → /, /store, /promo, /cart, /checkout, /faq
    │   ├── (auth)/               → /login, /register
    │   ├── account/              → profile + order history
    │   ├── admin/                → dashboard, products, promo, orders, users, content, settings
    │   ├── globals.css           → design tokens, glass utilities, animations
    │   ├── layout.tsx            → root metadata, fonts, providers
    │   ├── sitemap.ts, robots.ts, opengraph-image.tsx
    │   └── error.tsx, not-found.tsx, loading.tsx
    ├── actions/                  → 'use server' mutations (auth, cart quote, checkout, admin CRUD)
    ├── services/                 → DB access & business logic (pricing, orders, catalog, account)
    ├── components/
    │   ├── ui/                   → Button, Input, Card, Modal, Toast, Accordion, Icon
    │   ├── layout/               → Navbar, Footer, AnnouncementBar, SetupNotice
    │   ├── home/ store/ cart/ account/ admin/
    ├── hooks/                    → useCart, useToast, …
    ├── lib/                      → env, utils, constants, validations, supabase clients
    └── types/                    → shared domain types
```

Rule of thumb used throughout: **pages fetch, services query, actions mutate, components render.** No page is a giant single file.

---

## How the critical flows work

### Server-side price validation

The client may only ever send `{ productId, quantity }[]`, a promo code string, and an idempotency key. Prices, discounts and totals are **never** accepted from the browser.

`quoteCart()` in `src/services/pricing.ts` is the single source of truth:

1. Re-reads every product row from the database by ID.
2. Rejects inactive, missing, or custom-price products.
3. Computes `subtotal` from database prices only.
4. Validates the promo through the `validate_promo_code()` SQL function.
5. Computes `discount` (capped by `max_discount` and by the subtotal) and `total`.

The `orders_total_ck` constraint (`total = greatest(subtotal - discount, 0)`) means even a compromised server cannot persist inconsistent money. All amounts are stored as **integer rupiah** — no floats, no rounding drift.

### Promo codes

Redemption happens inside the `redeem_promo()` PL/pgSQL function, which takes a `SELECT … FOR UPDATE` row lock on the promo before incrementing, making it atomic and race-safe under concurrent checkouts.

- One redemption per account, enforced by a partial `UNIQUE (promo_id, user_id)` index (and `(promo_id, guest_email)` for guests) — not by an application-level check.
- `redemption_count` is `UPDATE`-blocked for non-admins by the `protect_redemption_count` trigger.
- If order creation fails after redemption, the order is rolled back so no phantom redemption remains.

Exact user-facing messages:

| Situation | Message |
| --- | --- |
| Valid | `✓ Kode promo berhasil digunakan` |
| Unknown code | `Kode promo tidak valid.` |
| Already used by this account | `Kamu sudah pernah menggunakan kode promo ini.` |
| Quota exhausted | `Kode promo sudah mencapai batas penggunaan.` |
| Past `valid_until` | `Kode promo sudah expired.` |

### WhatsApp checkout

`checkoutAction()`:

1. Re-quotes the cart server-side (step above).
2. Generates a human-readable order number `ZYN-YYYYMMDD-XXXX` via `next_order_number()` (the UUID stays the primary key).
3. Inserts the `orders` row, the `order_items` rows (**snapshotting product name and price** so later admin edits never rewrite history), the `payments` row, and the promo redemption — then returns a `https://wa.me/6285141308100?text=…` URL built with `encodeURIComponent`.

The button shows `Membuat Pesanan...` and is disabled while in flight. An `idempotency_key` with a partial unique index means a double-click or a retried request cannot create two orders. WhatsApp is opened **only** when the server reports success; on failure the user sees the error and nothing is opened. On success a toast reads **Order berhasil dibuat!**

Message format sent to WhatsApp:

```
Halo Zynex Studio 👋

Saya ingin melakukan pemesanan.

*Order ID:* ZYN-20260905-0001

*Nama:* Budi Santoso
*Email:* budi@email.com
*WhatsApp:* 081234567890

*Produk:*
1. Domain .my.id × 1 — Rp5.000
2. Canva Pro × 2 — Rp4.000

*Subtotal:* Rp9.000
*Promo:* HEMAT2K
*Diskon:* Rp2.000

*Total:* Rp7.000

*Status:* Pending

Mohon diproses. Terima kasih 🙏
```

When no promo is used the message contains `Promo: Tidak ada` and `Diskon: Rp0`.

---

## Security model

| Concern | Mitigation |
| --- | --- |
| Admin routes | `middleware.ts` gate **plus** a server-side `role = 'admin'` check in `src/app/admin/layout.tsx` **plus** RLS policies. Removing the nav link changes nothing. |
| Privilege escalation | `protect_profile_privileges` trigger rejects any non-admin attempt to change `role` or `is_active`; the server action additionally refuses self-targeted role changes. |
| Price tampering | Frontend money values are ignored entirely; see *Server-side price validation*. |
| Promo abuse | Database-level uniqueness + row locking + trigger-protected counters. |
| Service-role key | Read only through `serviceRoleKey()`, which throws in a browser context; never `NEXT_PUBLIC_`. |
| Data access | RLS on every table: customers can read only their own orders, redemptions and profile. |
| Input | Every server action validates with Zod before touching the database. |
| Headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` set in `next.config.ts`. |

---

## Deploying to Vercel

1. Push the repository to GitHub.
2. In Vercel choose **Add New → Project** and import it (the Next.js preset is detected automatically).
3. Add the environment variables under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(mark it as sensitive — it is server-only)*
   - `NEXT_PUBLIC_SITE_URL` → your production URL, e.g. `https://zynexstudio.id`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` *(optional)*
4. Deploy.
5. Back in Supabase, set **Authentication → URL Configuration → Site URL** to your production domain and add `https://your-domain.com/**` to the redirect allow-list.

The seeder is a local/CI utility — it is never bundled into the deployed app.

---

## Troubleshooting

**"Supabase belum dikonfigurasi" is showing.**
`.env.local` is missing, malformed, or the dev server was started before you created it. Fix the file and restart `npm run dev` (env vars are read at boot).

**`npm run seed` fails with "SUPABASE_SERVICE_ROLE_KEY belum diset".**
The seeder reads `.env.local` and then `.env`. Make sure the key is present and has no surrounding quotes.

**Images do not load after uploading in the admin panel.**
`supabase/schema.sql` creates the `product-images` bucket as public. If you created it manually, set it to public under **Storage → product-images → Configuration**.

**`/admin` redirects me to `/login` even though I am signed in.**
Your profile still has `role = 'customer'`. Re-check [Step 9](#step-9--promote-yourself-to-admin), then sign out and back in so the session is re-read.

**Emails are not arriving on signup.**
Supabase's built-in SMTP is heavily rate-limited. Disable email confirmation for development, or configure a custom SMTP provider under **Authentication → Emails**.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed / re-seed the database |

---

© Zynex Studio — Premium Digital Products & Services.
