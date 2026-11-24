# Deploying the Reown website to Cloudflare

The site runs on **Cloudflare Workers** (free plan):

| Piece | Cloudflare product | Free-plan limits |
|---|---|---|
| Pages, CMS and API | Workers | 100,000 requests/day, 10 ms CPU per request |
| CSS, JS and images in `/public` | Workers Static Assets (CDN) | Unlimited, and doesn't count as requests |
| Content, leads and subscribers | D1 (SQLite) database `reown-db` | 5 GB storage, 5M reads/day |
| CMS uploads (images, PDFs) | Workers KV namespace `MEDIA` | 1 GB storage, 1,000 uploads/day |

**Upgrade later:** the **Workers Paid plan costs $5/month**. It raises the CPU limit to 30 s and the request limit to 10M per month. Upgrade if the Cloudflare dashboard shows "Exceeded CPU" errors.

## How deploys work
The GitHub repo `daprof12/Reownltd` is connected to Cloudflare Workers Builds. Every `git push` to `main`:
1. runs `npm clean-install`
2. runs `npx wrangler deploy`, which first precompiles the EJS templates (`scripts/build-templates.js`) and then uploads the Worker and the `/public` files.

On the first visit, the D1 tables are created and filled with the default content automatically.

## Database and media storage
You don't need to create anything by hand. `wrangler.jsonc` declares the D1 database `reown-db` and the KV namespace `MEDIA` without IDs. On the first deploy, Wrangler creates both automatically and links them to the Worker. Later deploys reuse them.

## Secrets
Set these in the Cloudflare dashboard (**Workers & Pages → reownltd → Settings → Variables and Secrets**, type **Secret**) or with Wrangler:
```powershell
npx wrangler secret put ADMIN_PASSWORD
```
```powershell
npx wrangler secret put SESSION_SECRET
```

| Secret | Purpose |
|---|---|
| `ADMIN_PASSWORD` | CMS login password (username `admin`). The CMS stays locked until it is set |
| `SESSION_SECRET` | Long random string that signs the login cookie |
| `RESEND_API_KEY` | *Optional.* Emails each new lead to you through [resend.com](https://resend.com) (free plan: 3,000 emails/month) |
| `MAIL_FROM` | *Optional.* Sender address for those emails, e.g. `Reown Website <website@reownltd.com>` |

## Connect reownltd.com
1. Add `reownltd.com` to Cloudflare: go to **Websites → Add a site** and choose the Free plan. Cloudflare then gives you two nameservers. Set them at your domain registrar, replacing the current ones.
2. Wait until the domain shows **Active** in Cloudflare. This takes minutes to a few hours.
3. Open **Workers & Pages → reownltd → Settings → Domains & Routes → Add → Custom domain**. Add `www.reownltd.com`, then add `reownltd.com` the same way.
4. HTTPS is issued automatically.

Before switching nameservers, check that Cloudflare imported your **MX records**, or email to info@reownltd.com will stop working.

## Local development
```powershell
npm install
```
```powershell
copy .dev.vars.example .dev.vars
```
```powershell
npm run dev
```
Then open http://localhost:8787. Locally, D1 and KV are simulated in `.wrangler/`.

## Backups
- D1 has **Time Travel**: you can restore the database to any minute in the last 30 days with `npx wrangler d1 time-travel restore reown-db --timestamp=...`.
- Export **Leads** and **Subscribers** to CSV from the CMS regularly.
