# Reown Ltd — Website + CMS

Corporate website for Reown Ltd with a built-in content manager. It runs on **Cloudflare Workers** and renders pages on the server (good for SEO). Content, leads and subscribers are stored in **Cloudflare D1**, and uploaded media in **Workers KV**.

## Run locally
```
npm install
copy .dev.vars.example .dev.vars
npm run dev        # http://localhost:8787
```
CMS: **http://localhost:8787/admin**. Locally the login is `admin` / `reown-admin` (from `.dev.vars`). In production, set the `ADMIN_PASSWORD` secret; the CMS stays locked until it is set.

Views in `views/*.ejs` are precompiled into `src/templates.gen.mjs` by `npm run build`. Wrangler runs this automatically before `dev` and `deploy`.

## What the CMS manages
| Area | What you can do |
|---|---|
| **Leads** | Every project brief from the popup form. Set a status (new → contacted → meeting → proposal → won/lost), add notes, reply by email/WhatsApp, export to CSV |
| **Portfolio** | Case studies with cover image, results, tags, category filters and a featured flag |
| **Blog** | Markdown editor with a toolbar, image upload, preview, categories, tags and per-post SEO title/description |
| **Industries** | Eight industry landing pages (`/industries/<slug>`) with challenges, solutions and related services |
| **Subscribers** | Newsletter sign-ups, export to CSV for Mailchimp/Brevo |
| **Services** | Ten service landing pages (`/services/<slug>`), each with an icon, features and content |
| **Page sections** | Edit or hide each homepage section: hero, stats, about, industries, process, why us, tech, testimonials, CTA, FAQ |
| **Settings & SEO** | Contact details, booking link (Calendly etc.), WhatsApp, social links, default meta, OG image, GA4, Search Console/Bing verification |
| **Media** | Upload and reuse images |

## SEO built in
- Each page gets its own title, description, canonical URL, Open Graph and Twitter tags
- JSON-LD structured data: Organization, WebSite, Service list, FAQPage, BlogPosting, CreativeWork and BreadcrumbList
- Auto-generated `/sitemap.xml`, `/robots.txt`, `/rss.xml` and a web manifest
- Pages are rendered on the server, use semantic HTML, lazy-load images, are compressed and support reduced motion

**After launch:** check `SITE_URL` in `wrangler.jsonc`, add your Search Console code under Settings, submit `/sitemap.xml` and publish 2–4 blog posts a month.

## ⚠️ Replace sample content before going live
The stats (120+ projects and so on), the six portfolio case studies (each marked "sample") and the testimonials (hidden by default) are **placeholders**. Replace them with real data in the CMS.

## Deploy
Cloudflare Workers (free plan). Every push to `main` on GitHub redeploys automatically. See [DEPLOY.md](DEPLOY.md) for secrets, the custom domain and backups.
