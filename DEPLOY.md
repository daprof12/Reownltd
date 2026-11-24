# Deploying the Reown website to Render

**Cost:** about **$7.25/month**. That covers the Render Starter web service and a 1 GB persistent disk. You need the disk so your content, leads, subscribers and uploaded images survive restarts and redeploys. Render's free plan has no disk, so everything you edit in the CMS would be lost.

The project already has everything Render needs:
- **`render.yaml`**: a one-click "Blueprint" that sets up the server, disk, health check and settings
- **`/healthz`**: a health check, so Render only switches to a new version once it works
- **`.gitignore`**: keeps private data (leads, subscribers, `.env`) out of GitHub

---

## Step 1 — Put the code on GitHub (5 min)
1. Sign in at **https://github.com** (create a free account if needed).
2. Go to **https://github.com/new** and fill it in:
   - Repository name: `reown-website`
   - Visibility: **Private**
   - Do **not** add a README, .gitignore or licence.
3. Click **Create repository** and copy its URL (e.g. `https://github.com/YOUR-NAME/reown-website.git`).
4. Push the code from this folder:
   ```powershell
   git commit -m "Reown website"
   git remote add origin https://github.com/YOUR-NAME/reown-website.git
   git push -u origin main
   ```
   The first time, Windows will open a GitHub sign-in window.

## Step 2 — Create the service on Render (10 min)
1. Go to **https://dashboard.render.com** and sign up with **GitHub**.
2. Click **New → Blueprint**.
3. Connect your GitHub account and pick the `reown-website` repository.
4. Render reads `render.yaml` and asks for a few values:
   - **ADMIN_PASSWORD**: choose a strong password (12+ characters) for the CMS.
   - **SMTP_\***: you can leave these empty for now. They only send you an email for each new lead.
5. Add a payment card when asked. The disk needs a paid plan.
6. Click **Apply**. The first deploy takes 2–4 minutes.
7. Open the link Render gives you (e.g. `https://reown-website.onrender.com`).
8. Sign in at `/admin` with username `admin` and your password.

> The live site starts from the built-in default content, which already includes your RC number and address. Any edits you made in the local CMS are **not** copied over, so make your real edits on the live CMS.

## Step 3 — Connect reownltd.com (15 min + DNS wait)
1. In Render, open the service, go to **Settings → Custom Domains**, and add both `www.reownltd.com` and `reownltd.com`.
2. At your domain registrar's DNS settings, add the records Render shows you. They are usually:

   | Type | Name / Host | Value |
   |---|---|---|
   | CNAME | `www` | `reown-website.onrender.com` |
   | A | `@` | `216.24.57.1` |

   Remove any old A/AAAA/CNAME records for `@` and `www` that point somewhere else. **Keep** your MX records, or email to info@reownltd.com will stop working.
3. Wait until Render shows **Verified** (minutes to a few hours). The HTTPS certificate is issued automatically.

## Step 4 — After going live
- **CMS → Settings & SEO:**
  - Confirm the Website URL is `https://www.reownltd.com`.
  - Add your phone, WhatsApp, booking link and social links.
- **Google Search Console** (https://search.google.com/search-console):
  - Add the domain and paste the verification code into the CMS.
  - Submit `https://www.reownltd.com/sitemap.xml`.
- **Bing Webmaster Tools:** do the same there. You can import directly from Google.
- **Google Analytics 4:** create a property and paste the `G-…` ID into the CMS.
- **Lead emails (optional):** on Render, open **Environment** and fill in `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM`. You can use the details of your info@reownltd.com mailbox, or a free Brevo SMTP account.

## Updating the site later
Any code change pushed to GitHub (`git push`) redeploys automatically. Content edits in the CMS are live immediately and need no redeploy.

## Backups
- Render takes **daily snapshots** of the disk and keeps them for 7 days. You can restore them from the Disk tab.
- Export **Leads** and **Subscribers** to CSV from the CMS regularly.
