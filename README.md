# DigitalStore — Premium Digital Products Marketplace

Wallet-based e-commerce for subscriptions, IPTV, software keys, game cards, gift cards. **No Stripe/PayPal** — internal wallet with server-verified atomic transactions.

Original premium dark UI inspired by modern digital stores (not a clone).

## Features
- **Wallet system**: deposit requests → admin approval → balance credit → instant purchases
- **Products**: categories, variants (1M/3M/12M), stock, digital inventory, automatic delivery
- **IPTV**: M3U, Xtream Codes, server/username/password per inventory item
- **Subscriptions**: expiry tracking, renewal, expiring-soon status
- **Orders**: wallet payment, inventory assignment, credentials delivery
- **Coupons**: percentage/fixed, limits, expiry
- **Favorites, search, cart (quick-buy), notifications**
- **Admin**: dashboard, products, categories, orders, inventory, deposits, transactions, subscriptions, coupons, audit logs, settings, banners, user management
- **Auth**: Supabase Auth, RLS, roles (customer/admin/super_admin), protected routes
- **i18n**: EN/FR/AR with RTL support structure
- **Currency**: DZD/EUR/USD configurable

## Tech Stack
- Next.js 16, TypeScript, Tailwind CSS 4, lucide-react
- Supabase: PostgreSQL, Auth, Storage, RLS
- Cloudflare-compatible (images unoptimized, no sharp)

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase project
npm run dev
```

Open http://localhost:3000

## Supabase Setup

1. Create a new Supabase project.
2. In SQL Editor, run `supabase.sql` (combined schema + RLS + procedures + seed). Alternatively run files in order:
   - `src/lib/supabase/schema-1-categories.sql`
   - `src/lib/supabase/schema-2-products-wallet.sql`
   - `src/lib/supabase/schema-3-inventory-orders.sql`
   - `src/lib/supabase/schema-4-subscriptions-coupons.sql`
   - `src/lib/supabase/schema-5-rls.sql`
   - `src/lib/supabase/schema-6-stored-procedures.sql`
   - `src/lib/supabase/seed.sql`
3. Create Storage buckets if needed: `products`, `screenshots`, `banners` (public).
4. Set env in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find keys in Project Settings → API.

## Admin Setup

Option A — script:
```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=StrongPass123! node scripts/init-admin.mjs
# Remove password from env after!
```

Option B — Supabase Dashboard:
1. Authentication → Add user (email/password, confirm).
2. Table Editor → profiles → set `role = super_admin` for that user.

Login at `/login` then visit `/admin`.

## Project Structure
```
src/
  app/
    page.tsx              Homepage
    shop/                 Shop with filters
    products/[slug]/      Product detail + purchase
    categories/[slug]/    Category listing
    search/               Search
    login/ register/ forgot-password/
    contact/ faq/ terms/ privacy/ cart/
    account/              Dashboard, wallet, orders, subscriptions, favorites, profile
    admin/                Dashboard, products, orders, inventory, deposits, etc.
    api/
      purchase/           POST wallet purchase (server-verified)
      wallet/deposit/     POST deposit request
      admin/products/     POST create product (admin)
      auth/logout/        POST logout
  components/
    ui/                   Button, Card, Input, etc.
    layout/               Navbar, Footer, AdminSidebar, AccountLayout
    products/             ProductCard, ProductGrid
  lib/
    supabase/             client, server-client, types, schema, seed
    actions/              wallet, purchase, products, admin, inventory-coupons, extra
    validations/          Zod schemas
    constants/            Currencies, languages, roles
    translations/         EN/FR/AR dictionary
    utils/                cn, formatCurrency, generateOrderNumber, etc.
```

## Wallet Flow
```
User: Deposit form (amount, payment_method, reference) → deposit_requests (pending)
Admin: /admin/deposits → Approve → wallet balance += amount + transaction + notification
User: Purchase → server verifies price/stock/balance → inventory reserved → wallet deducted atomically → order completed → credentials delivered → subscription created if applicable
```

Atomicity: `execute_transaction` stored procedure locks wallet row, checks negative balance, updates, inserts transaction in one DB transaction. Rollback on any failure.

## Security
- RLS on all tables; service_role only on server
- Server-side price/stock/balance verification (never trust client)
- Inventory never exposed to non-owner
- Credentials only via authenticated order/subscription
- Audit logs for admin actions

## Environment Variables
See `.env.example`. Never commit real secrets. Service role key is server-only.

## Cloudflare Deployment

### OpenNext / Cloudflare Workers
```bash
npm run build
# Deploy with OpenNext Cloudflare adapter or upload .next to Cloudflare Pages
# Set env vars in Cloudflare dashboard
```
`next.config.ts` has `images.unoptimized = true` for Cloudflare.

### Supabase
Allow Cloudflare IPs; no additional config.

## Local Development Without Supabase
The app runs with `placeholder` Supabase env — pages show mock data. Real wallet/purchase require valid Supabase.

## Testing Critical Paths
1. Register → verify email → login
2. Wallet → Add Balance → submit deposit → admin approves → balance increases
3. Product → Buy → wallet deducted → order + inventory assigned → view credentials in /account/orders/[id]
4. Subscription → renew → expiry extended
5. Admin refunds → wallet credited back

## Production Checklist
- [ ] Run supabase.sql and verify RLS
- [ ] Create storage buckets
- [ ] Init admin and rotate password
- [ ] Set env on host (do not commit)
- [ ] Enable email confirmations in Supabase Auth
- [ ] Set `NEXT_PUBLIC_APP_URL` to production URL

## License
Demo project. Replace demo credentials with legitimate inventory only.
