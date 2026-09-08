# Deployment Guide — GitHub + Cloudflare

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "DigitalStore — contact-order rebuild"
git remote add origin https://github.com/OBITOLZ0X/digital-store.git
git push -u origin main --force
```

> `.env.local` and `data/` are git-ignored — credentials and store data never leave the machine.

## 2. Create the KV namespace (products storage)

Dashboard: **Storage & Databases → KV → Create namespace** → name it `digital-store-data`, copy the **Namespace ID**, paste it into `wrangler.jsonc` (replace `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`), commit + push.

Or via API:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/storage/kv/namespaces" \
  -H "Authorization: Bearer <API_TOKEN>" -H "Content-Type: application/json" \
  --data '{"title":"digital-store-data"}'
```

## 3. Connect GitHub → Cloudflare (auto-deploy on push)

Dashboard: **Workers & Pages → Create → Workers → Import a repository**
- Select `OBITOLZ0X/digital-store`
- Build command: `npx opennextjs-cloudflare build`
- Deploy

Then **Settings → Variables and Secrets** → add (type **Secret**):
- `ADMIN_EMAIL` — admin login email
- `ADMIN_PASSWORD` — admin login password (8+ chars)
- `SESSION_SECRET` — long random string

Redeploy once after adding secrets. Every future `git push` auto-deploys.

## 4. Or deploy directly from your machine (no GitHub link)

```bash
set CLOUDFLARE_API_TOKEN=<token>
set CLOUDFLARE_ACCOUNT_ID=<account_id>
npx wrangler login   # first time only
npm run deploy
```

Secrets (same names as above):

```bash
echo "<value>" | npx wrangler secret put ADMIN_EMAIL
echo "<value>" | npx wrangler secret put ADMIN_PASSWORD
echo "<value>" | npx wrangler secret put SESSION_SECRET
```

## Notes

- Store data (products/categories/contacts/settings/visits) lives in **KV** on Cloudflare and in `data/` on a Node server — same code, no database needed.
- Cookies are `secure` in production — use the https workers.dev URL.
- Local Cloudflare preview: `npm run preview` (needs a real KV namespace ID in `wrangler.jsonc`).
- Change admin credentials later from **Settings → Admin login** in the panel (on Cloudflare it points you to the dashboard since worker secrets are managed there).
