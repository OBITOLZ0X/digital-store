# DigitalStore — Digital Products Landing Shop

A catalog of digital products (subscriptions, IPTV, software keys, gift cards) where **buying happens in chat**: the buyer opens a product, sees the prices for every period, and messages the seller on WhatsApp / Telegram / any configured channel. **No user accounts, no cart, no wallet, no checkout.**

## How it works
- **Storefront** — landing-style pages: home, shop, category, product (periods & prices + contact buttons), FAQ, contact, search. Product views are counted anonymously for the admin dashboard.
- **Admin panel** (`/admin`) — the only login. Sections: Dashboard (visit analytics), Products, Categories, Contact (channels), Settings.
  - **Products**: add name, description, image, one price or multiple periods (1 Month / 3 Months / …) each with its price, and pick which contact channels buyers use for this product.
  - **Contact**: add WhatsApp / Telegram / Email / Instagram / Facebook / custom links. These become the buy buttons.
  - **Settings**: store name, currency — and the admin login email/password (change them here).

## Data — no database
Everything is stored in two JSON files:
- `data/store.data.json` — products, categories, contacts, settings
- `data/visits.json` — anonymous product view counts

Admin credentials live in environment variables (never in the JSON). On Cloudflare, set them as secret variables in the Worker dashboard.

## Run

```bash
npm install
npm run build
npm start
```

## Deploy to Cloudflare (+ GitHub)

See **[DEPLOY.md](DEPLOY.md)** — GitHub push → auto-deploy via Workers Builds, or `npm run deploy` directly.
Products/settings persist in **Cloudflare KV** (create a namespace and put its ID in `wrangler.jsonc`).

Environment (`.env.local`):
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-8+chars
SESSION_SECRET=long-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

First login: `/admin/login` → change the password in **Settings → Admin login**.

## Cloudflare
Deployed via **@opennextjs/cloudflare** (verified: `npm run build:cf` + `wrangler deploy --dry-run` pass).
- On Workers, the app reads the KV binding `KV_BINDING` through `getCloudflareContext()` — products/settings/visits persist to KV automatically; on Node they persist to the `data/` folder. No code changes needed between hosts.
- Set `RUNNING_ON=cloudflare` (already in wrangler.jsonc vars) so the credentials page points you to the dashboard for secret changes — env secrets can't be written from inside a worker.
