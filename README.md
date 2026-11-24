# Reown Ltd — Website + CMS

Corporate website for Reown Ltd with a built-in content manager. It runs on Node.js + Express, renders pages on the server (good for SEO) and stores content in a JSON file, so it needs no database.

## Run locally
```
npm install
npm start          # http://localhost:3000
```
CMS: **http://localhost:3000/admin**. In development the login is `admin` / `reown-admin`. In production, set `ADMIN_PASSWORD` in `.env`; without it, admin login is disabled.

## What the CMS manages
| Area | What you can do |
|---|---|
| **Leads** | Every project brief from the popup form. Set a status (new → contacted → meeting → proposal → won/lost), add notes, reply by email/WhatsApp, export to CSV |
| **Portfolio** | Case studies with cover image, results, tags, category filters and a featured flag |
| **Blog** | Markdown editor with a toolbar, image upload, preview, categories, tags and per-post SEO title/description |
| **Services** | Ten service landing pages (`/services/<slug>`), each with an icon, features and content |
| **Page sections** | Edit or hide each homepage section: hero, stats, about, industries, process, why us, tech, testimonials, CTA, FAQ |
| **Settings & SEO** | Contact details, booking link (Calendly etc.), WhatsApp, social links, default meta, OG image, GA4, Search Console/Bing verification |
| **Media** | Upload and reuse images |

## SEO built in
- Each page gets its own title, description, canonical URL, Open Graph and Twitter tags
- JSON-LD structured data: Organization, WebSite, Service list, FAQPage, BlogPosting, CreativeWork and BreadcrumbList
- Auto-generated `/sitemap.xml`, `/robots.txt`, `/rss.xml` and a web manifest
- Pages are rendered on the server, use semantic HTML, lazy-load images, are compressed and support reduced motion

**After launch:** set `SITE_URL`, add your Search Console code under Settings, submit `/sitemap.xml` and publish 2–4 blog posts a month.

## ⚠️ Replace sample content before going live
The stats (120+ projects and so on), the six portfolio case studies (each marked "sample") and the testimonials (hidden by default) are **placeholders**. Replace them with real data in the CMS.

## Deploy
**Render (recommended):** follow [DEPLOY.md](DEPLOY.md), which uses the included `render.yaml` blueprint.

Other hosts: you can deploy to any Node host (Render, Railway, a VPS with PM2, cPanel Node app). Copy `.env.example` to `.env` and fill it in. Keep the `data/` and `uploads/` folders on persistent storage, and back them up, because they hold all your content and leads. To get an email for each new lead, fill in the `SMTP_*` variables.
