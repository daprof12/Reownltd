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
The domain is registered at **Hostinger**, and the **info@reownltd.com** mailbox is Hostinger Email. These steps move only the DNS to Cloudflare. Hostinger stays your registrar and your email host.

### A. Add the domain to Cloudflare
1. In the Cloudflare dashboard, click **Add → Connect a domain**, enter `reownltd.com` and choose the **Free** plan.
2. Cloudflare scans your current DNS records. **Check that these email records are in the list.** Add any that are missing:

   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | MX | `@` | `mx1.hostinger.com` (priority 5) | — |
   | MX | `@` | `mx2.hostinger.com` (priority 10) | — |
   | TXT | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` | — |
   | CNAME | `hostingermail-a._domainkey` | `hostingermail-a.dkim.mail.hostinger.com` | **DNS only** (grey cloud) |
   | CNAME | `hostingermail-b._domainkey` | `hostingermail-b.dkim.mail.hostinger.com` | **DNS only** |
   | CNAME | `hostingermail-c._domainkey` | `hostingermail-c.dkim.mail.hostinger.com` | **DNS only** |
   | CNAME | `autodiscover` | `autodiscover.mail.hostinger.com` | **DNS only** |
   | CNAME | `autoconfig` | `autoconfig.mail.hostinger.com` | **DNS only** |

3. **Delete** the old website records: the **A** record for `@` pointing to `2.57.91.91` and the **CNAME** for `www`. The Worker replaces them.
4. **Recommended:** add a DMARC record so your emails are less likely to land in spam:

   | Type | Name | Content |
   |---|---|---|
   | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@reownltd.com` |

### B. Point Hostinger at Cloudflare
1. In **Hostinger hPanel**, open **Domains → reownltd.com → DNS / Nameservers → Change nameservers**.
2. Choose **Use custom nameservers**, enter the **two nameservers Cloudflare shows you** (e.g. `xxx.ns.cloudflare.com`), and save.
3. If Hostinger has **DNSSEC** turned on for the domain, turn it off first. You can turn it on again later from Cloudflare.
4. Wait for Cloudflare to email you that the domain is **Active**. This takes from minutes up to 24 hours.

### C. Attach the domain to the Worker
Choose **one** of these:
- **Dashboard:** go to **Workers & Pages → reownltd → Settings → Domains & Routes → Add → Custom domain**. Add `www.reownltd.com`, then `reownltd.com`.
- **Config:** add the routes below to `wrangler.jsonc` and push. Only do this once the domain is Active, or the build fails.
  ```jsonc
  "routes": [
    { "pattern": "www.reownltd.com", "custom_domain": true },
    { "pattern": "reownltd.com", "custom_domain": true }
  ]
  ```

HTTPS certificates are issued automatically. `reownltd.com` redirects to `https://www.reownltd.com`, which is handled in the Worker code.

### D. Check email still works
Send a test email to **info@reownltd.com** from Gmail, and reply from Hostinger webmail. Both should arrive.

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
