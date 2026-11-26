// Reown Ltd website + CMS — Cloudflare Worker
// Static files in /public are served by Workers Static Assets before this code runs.
import { marked } from 'marked';
import slugify from 'slugify';
import icon from '../lib/icons.js';
import T from './templates.gen.mjs';
import * as store from './store.mjs';

marked.setOptions({ gfm: true, breaks: false });

// ---------- helpers ----------
const md = (s) => marked.parse(s || '');
const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/[#*_>`\[\]]/g, '').replace(/\s+/g, ' ').trim();
const clip = (s, n = 160) => { s = strip(s); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const readTime = (s) => Math.max(1, Math.round(strip(s).split(' ').length / 220));
const toSlug = (s) => slugify(String(s || ''), { lower: true, strict: true }).slice(0, 80);
const str = (v, n) => String(v ?? '').trim().slice(0, n);
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&#34;', "'": '&#39;' };
const escapeFn = (v) => v == null ? '' : String(v).replace(/[&<>"']/g, c => ESC[c]);
const xmlEsc = (s) => String(s || '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
function respond(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: { ...SECURITY_HEADERS, ...headers } });
}
const html = (body, status = 200, headers = {}) => respond(body, status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
const json = (obj, status = 200, headers = {}) => respond(JSON.stringify(obj), status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
const redirect = (loc, status = 302, headers = {}) => respond(null, status, { Location: loc, ...headers });
const text = (body, type = 'text/plain; charset=utf-8', headers = {}) => respond(body, 200, { 'Content-Type': type, ...headers });

// ---------- templates ----------
function render(name, locals) {
  const fn = T[name];
  if (!fn) throw new Error('Missing template: ' + name);
  const dir = name.includes('/') ? name.slice(0, name.lastIndexOf('/') + 1) : '';
  const include = (p, data) => {
    const key = (dir + p).replace(/\.ejs$/, '');
    const target = T[key] ? key : p.replace(/\.ejs$/, '');
    return render(target, { ...locals, ...(data || {}) });
  };
  return fn(locals, escapeFn, include);
}

// ---------- rate limiting (per isolate, best effort) ----------
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

// ---------- admin session (signed cookie) ----------
const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function hmac(env, data) {
  const secret = env.SESSION_SECRET || env.ADMIN_PASSWORD || '';
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
async function safeEq(a, b) {
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(String(a))), crypto.subtle.digest('SHA-256', enc.encode(String(b)))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let d = 0; for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}
const COOKIE = 'reown_admin';
async function makeSession(env) {
  const payload = String(Date.now() + 8 * 3600 * 1000);
  return payload + '.' + await hmac(env, payload);
}
async function isAdmin(req, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const m = (req.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || +exp < Date.now()) return false;
  return safeEq(sig, await hmac(env, exp));
}
const cookieAttrs = (url) => `Path=/; HttpOnly; SameSite=Strict${url.protocol === 'https:' ? '; Secure' : ''}`;

// ---------- SEO ----------
function makeCtx(req, env, db) {
  const url = new URL(req.url);
  const base = (env.SITE_URL || db.settings.siteUrl || url.origin).replace(/\/$/, '');
  const abs = (p) => (!p ? '' : /^https?:/.test(p) ? p : base + (p.startsWith('/') ? p : '/' + p));
  const pub = (col) => db[col].filter(x => x.published);
  const services = pub('services').sort((a, b) => (a.order || 0) - (b.order || 0));
  const industries = pub('industries').sort((a, b) => (a.order || 0) - (b.order || 0));
  const posts = pub('posts').sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  const portfolio = pub('portfolio');

  function seo({ title, description, image, type = 'website', jsonLd = [], noindex = false, crumbs } = {}) {
    const s = db.settings;
    const org = {
      '@type': 'Organization', '@id': base + '/#organization', name: s.siteName, legalName: s.siteName, url: base,
      identifier: s.rcNumber ? { '@type': 'PropertyValue', propertyID: 'CAC RC Number', value: 'RC ' + s.rcNumber } : undefined,
      areaServed: 'Worldwide', logo: abs('/img/logo-full.webp'), slogan: s.tagline, description: s.seo.description,
      email: s.email || undefined, telephone: s.phone || undefined,
      address: s.postal && s.postal.street
        ? { '@type': 'PostalAddress', streetAddress: s.postal.street, addressLocality: s.postal.locality, addressRegion: s.postal.region, addressCountry: s.postal.country }
        : (s.address || undefined),
      sameAs: Object.values(s.social || {}).filter(Boolean),
      contactPoint: s.email ? [{ '@type': 'ContactPoint', contactType: 'sales', email: s.email, telephone: s.phone || undefined, availableLanguage: ['English'] }] : undefined,
    };
    const graph = [org, ...jsonLd];
    if (crumbs) graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [{ name: 'Home', url: '/' }, ...crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.url) })),
    });
    return {
      title: title ? `${title} | ${s.siteName}` : s.seo.title,
      description: clip(description || s.seo.description, 160),
      keywords: s.seo.keywords,
      canonical: base + url.pathname.replace(/\/$/, '') || base + '/',
      image: abs(image || s.seo.ogImage), type, noindex,
      jsonLd: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c'),
    };
  }

  const locals = {
    s: db.settings, sec: db.sections, navServices: services, navIndustries: industries,
    icon, md, clip, fmtDate, readTime, path: url.pathname, year: new Date().getFullYear(),
  };
  const page = (name, extra, status = 200) => html(render(name, { ...locals, ...extra }), status, { 'Cache-Control': 'no-cache' });
  return { url, base, abs, db, services, industries, posts, portfolio, seo, page };
}

// ---------- public routes ----------
async function publicRoute(req, env, ctx, c) {
  const { url, seo, page, services, industries, posts, portfolio, abs, base, db } = c;
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const seg = p.split('/').filter(Boolean);

  if (p === '/') {
    const s = db.settings;
    const jsonLd = [
      { '@type': 'WebSite', '@id': base + '/#website', url: base, name: s.siteName, publisher: { '@id': base + '/#organization' } },
      { '@type': 'ItemList', name: 'Services', itemListElement: services.map((sv, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Service', name: sv.title, description: sv.summary, url: abs('/services/' + sv.slug), provider: { '@id': base + '/#organization' } } })) },
    ];
    if (db.sections.faq.enabled) jsonLd.push({ '@type': 'FAQPage', mainEntity: db.sections.faq.items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
    return page('index', {
      seo: seo({ jsonLd }), services,
      projects: [...portfolio].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 6),
      posts: posts.slice(0, 3),
    });
  }

  if (p === '/services') return redirect('/#services', 301);
  if (seg[0] === 'services' && seg.length === 2) {
    const sv = services.find(x => x.slug === seg[1]);
    if (!sv) return null;
    return page('service', {
      sv, services, projects: portfolio.slice(0, 3),
      seo: seo({
        title: sv.title, description: sv.summary,
        jsonLd: [{ '@type': 'Service', name: sv.title, description: sv.summary, serviceType: sv.title, provider: { '@id': base + '/#organization' }, areaServed: 'Worldwide' }],
        crumbs: [{ name: 'Services', url: '/#services' }, { name: sv.title, url: '/services/' + sv.slug }],
      }),
    });
  }

  if (p === '/industries') {
    return page('industries', {
      list: industries,
      seo: seo({
        title: 'Industries We Serve',
        description: 'Reown builds AI, software, mobile, blockchain, IoT and cybersecurity solutions for government, finance, healthcare, education, logistics, retail, energy and enterprise.',
        jsonLd: [{ '@type': 'ItemList', name: 'Industries', itemListElement: industries.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.title, url: abs('/industries/' + x.slug) })) }],
        crumbs: [{ name: 'Industries', url: '/industries' }],
      }),
    });
  }
  if (seg[0] === 'industries' && seg.length === 2) {
    const ind = industries.find(x => x.slug === seg[1]);
    if (!ind) return null;
    const related = (ind.services || []).map(sl => services.find(s => s.slug === sl)).filter(Boolean);
    const kw = ind.title.split(/[ &]+/)[0].toLowerCase();
    const projects = portfolio.filter(x => x.industry && (x.industry.toLowerCase().includes(kw) || ind.title.toLowerCase().includes(x.industry.toLowerCase()))).slice(0, 3);
    return page('industry', {
      ind, related, projects, others: industries.filter(x => x.id !== ind.id),
      seo: seo({
        title: ind.seoTitle || `${ind.title} Software Solutions`, description: ind.seoDescription || ind.summary,
        jsonLd: [{
          '@type': 'Service', name: `${ind.title} technology solutions`, description: ind.summary, serviceType: ind.title,
          provider: { '@id': base + '/#organization' }, audience: { '@type': 'BusinessAudience', name: ind.title },
          hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Solutions', itemListElement: (ind.solutions || []).map(x => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: x } })) },
        }],
        crumbs: [{ name: 'Industries', url: '/industries' }, { name: ind.title, url: '/industries/' + ind.slug }],
      }),
    });
  }

  if (p === '/resources/digital-transformation-checklist') {
    return page('checklist', { seo: seo({ title: 'Digital Transformation Checklist', description: 'A free, practical 25-point checklist to plan, build and secure your organisation’s digital transformation — from strategy and data to AI, security and people.', crumbs: [{ name: 'Resources', url: p }] }) });
  }

  if (p === '/portfolio') {
    const cats = [...new Set(portfolio.map(x => x.category).filter(Boolean))];
    return page('portfolio', {
      projects: portfolio, cats,
      seo: seo({ title: 'Portfolio & Case Studies', description: 'Explore Reown projects across AI, web, mobile, desktop, blockchain, IoT and cybersecurity for government, enterprise and business clients.', crumbs: [{ name: 'Portfolio', url: '/portfolio' }] }),
    });
  }
  if (seg[0] === 'portfolio' && seg.length === 2) {
    const pr = portfolio.find(x => x.slug === seg[1]);
    if (!pr) return null;
    return page('project', {
      p: pr, others: portfolio.filter(x => x.id !== pr.id).slice(0, 3),
      seo: seo({
        title: pr.title, description: pr.summary, image: pr.cover, type: 'article',
        jsonLd: [{ '@type': 'CreativeWork', name: pr.title, description: pr.summary, about: pr.industry, keywords: (pr.tags || []).join(', '), dateCreated: pr.year, creator: { '@id': base + '/#organization' }, image: pr.cover ? abs(pr.cover) : undefined }],
        crumbs: [{ name: 'Portfolio', url: '/portfolio' }, { name: pr.title, url: '/portfolio/' + pr.slug }],
      }),
    });
  }

  if (p === '/blog') {
    const cats = [...new Set(posts.map(x => x.category).filter(Boolean))];
    const cat = url.searchParams.get('category') || '';
    const q = String(url.searchParams.get('q') || '').toLowerCase().slice(0, 80);
    let list = posts.filter(x => (!cat || x.category === cat) && (!q || (x.title + ' ' + x.excerpt + ' ' + (x.tags || []).join(' ')).toLowerCase().includes(q)));
    const per = 9, pg = Math.max(1, parseInt(url.searchParams.get('page')) || 1), pages = Math.max(1, Math.ceil(list.length / per));
    list = list.slice((pg - 1) * per, pg * per);
    return page('blog', {
      list, cats, cat, q, page: pg, pages,
      seo: seo({ title: cat ? `${cat} Articles` : 'Blog & Insights', description: 'Insights, guides and news from Reown on AI, software development, automation, blockchain, cybersecurity and digital transformation.', noindex: !!q, crumbs: [{ name: 'Blog', url: '/blog' }] }),
    });
  }
  if (seg[0] === 'blog' && seg.length === 2) {
    const po = posts.find(x => x.slug === seg[1]);
    if (!po) return null;
    const related = posts.filter(x => x.id !== po.id && (x.category === po.category || (x.tags || []).some(t => (po.tags || []).includes(t)))).slice(0, 3);
    return page('post', {
      p: po, related,
      seo: seo({
        title: po.seoTitle || po.title, description: po.seoDescription || po.excerpt, image: po.cover, type: 'article',
        jsonLd: [{
          '@type': 'BlogPosting', headline: po.title, description: po.excerpt, datePublished: po.publishedAt, dateModified: po.updatedAt || po.publishedAt,
          author: { '@type': 'Organization', name: po.author || db.settings.siteName }, publisher: { '@id': base + '/#organization' },
          image: abs(po.cover || db.settings.seo.ogImage), mainEntityOfPage: base + '/blog/' + po.slug, keywords: (po.tags || []).join(', '), articleSection: po.category,
        }],
        crumbs: [{ name: 'Blog', url: '/blog' }, { name: po.title, url: '/blog/' + po.slug }],
      }),
    });
  }

  if (p === '/robots.txt') return text(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`);
  if (p === '/sitemap.xml') {
    const urls = [
      { loc: '/', pr: '1.0', cf: 'weekly' }, { loc: '/portfolio', pr: '0.8', cf: 'weekly' }, { loc: '/blog', pr: '0.8', cf: 'daily' },
      { loc: '/industries', pr: '0.8', cf: 'monthly' }, { loc: '/resources/digital-transformation-checklist', pr: '0.6', cf: 'yearly' },
      ...services.map(x => ({ loc: '/services/' + x.slug, pr: '0.9', cf: 'monthly', lm: x.updatedAt })),
      ...industries.map(x => ({ loc: '/industries/' + x.slug, pr: '0.85', cf: 'monthly', lm: x.updatedAt })),
      ...portfolio.map(x => ({ loc: '/portfolio/' + x.slug, pr: '0.7', cf: 'monthly', lm: x.updatedAt })),
      ...posts.map(x => ({ loc: '/blog/' + x.slug, pr: '0.7', cf: 'monthly', lm: x.updatedAt || x.publishedAt })),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u =>
      `  <url><loc>${base}${u.loc}</loc>${u.lm ? `<lastmod>${new Date(u.lm).toISOString().slice(0, 10)}</lastmod>` : ''}<changefreq>${u.cf}</changefreq><priority>${u.pr}</priority></url>`).join('\n')}\n</urlset>`;
    return text(xml, 'application/xml; charset=utf-8');
  }
  if (p === '/rss.xml') {
    const s = db.settings;
    const items = posts.slice(0, 20).map(x => `<item><title>${xmlEsc(x.title)}</title><link>${base}/blog/${x.slug}</link><guid>${base}/blog/${x.slug}</guid><pubDate>${new Date(x.publishedAt).toUTCString()}</pubDate><description>${xmlEsc(x.excerpt)}</description><category>${xmlEsc(x.category)}</category></item>`).join('');
    return text(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xmlEsc(s.siteName)} Blog</title><link>${base}/blog</link><description>${xmlEsc(s.seo.description)}</description><language>en</language>${items}</channel></rss>`, 'application/rss+xml; charset=utf-8');
  }
  if (p === '/manifest.webmanifest') {
    return text(JSON.stringify({ name: db.settings.siteName, short_name: 'Reown', start_url: '/', display: 'standalone', background_color: '#F8FAFF', theme_color: '#0B1F5B', icons: [{ src: '/img/logo-mark.webp', sizes: '1536x1024', type: 'image/webp' }] }), 'application/manifest+json');
  }
  return null;
}

// ---------- lead capture ----------
async function contact(req, env, ctx) {
  const b = await req.json().catch(() => ({}));
  if (b.website) return json({ ok: true });
  const ip = req.headers.get('CF-Connecting-IP') || 'x';
  if (limited('c:' + ip, 5, 10 * 60 * 1000)) return json({ ok: false, error: 'Too many requests. Please try again later.' }, 429);
  const lead = {
    name: str(b.name, 120), email: str(b.email, 160).toLowerCase(), phone: str(b.phone, 40), company: str(b.company, 160),
    role: str(b.role, 120), country: str(b.country, 80),
    services: Array.isArray(b.services) ? b.services.map(x => str(x, 80)).slice(0, 12) : [],
    projectType: str(b.projectType, 80), idea: str(b.idea, 5000), budget: str(b.budget, 60), timeline: str(b.timeline, 60),
    contactPref: str(b.contactPref, 40), meetingTime: str(b.meetingTime, 120), source: str(b.source, 200),
    status: 'new', notes: '',
  };
  if (!lead.name || !isEmail(lead.email) || lead.idea.length < 10)
    return json({ ok: false, error: 'Please provide your name, a valid email and a short description of your idea.' }, 400);
  const saved = await store.insert(env, 'leads', lead);
  const db = await store.load(env);
  ctx.waitUntil(notify(env, db.settings, saved).catch(e => console.error('[mail]', e.message)));
  return json({ ok: true, bookingUrl: db.settings.bookingUrl || '' });
}

// Optional email alert via Resend (https://resend.com) — set RESEND_API_KEY, MAIL_FROM, LEADS_TO
async function notify(env, settings, lead) {
  if (!env.RESEND_API_KEY) return;
  const to = env.LEADS_TO || settings.email;
  const lines = Object.entries(lead).filter(([k, v]) => v && !['id', 'updatedAt', 'notes', 'status'].includes(k)).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM || 'Reown Website <onboarding@resend.dev>', to: [to], reply_to: lead.email, subject: `New project enquiry — ${lead.name}${lead.company ? ' (' + lead.company + ')' : ''}`, text: lines.join('\n') }),
  });
  if (!r.ok) throw new Error('Resend ' + r.status + ' ' + await r.text());
}

async function subscribe(req, env) {
  const b = await req.json().catch(() => ({}));
  if (b.website) return json({ ok: true });
  const ip = req.headers.get('CF-Connecting-IP') || 'x';
  if (limited('s:' + ip, 5, 10 * 60 * 1000)) return json({ ok: false, error: 'Too many requests. Please try again later.' }, 429);
  const email = str(b.email, 160).toLowerCase();
  if (!isEmail(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  const existing = await env.DB.prepare("SELECT 1 FROM docs WHERE col = 'subscribers' AND json_extract(data, '$.email') = ?").bind(email).first().catch(() => null);
  if (!existing) await store.insert(env, 'subscribers', { email, name: str(b.name, 120), source: str(b.source, 200), status: 'active' });
  const db = await store.load(env);
  const n = db.settings.newsletter || {};
  return json({ ok: true, leadMagnetUrl: n.leadMagnetUrl || '', leadMagnetTitle: n.leadMagnetTitle || '' });
}

// ---------- media (Workers KV) ----------
const MEDIA_TYPES = /^(image\/(png|jpe?g|webp|gif|avif|svg\+xml)|application\/pdf)$/;
async function serveMedia(env, key) {
  const { value, metadata } = await env.MEDIA.getWithMetadata(key, { type: 'arrayBuffer' });
  if (!value) return null;
  const type = (metadata && metadata.type) || 'application/octet-stream';
  const headers = { 'Content-Type': type, 'Cache-Control': 'public, max-age=2592000, immutable' };
  if (type === 'image/svg+xml') headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
  return respond(value, 200, headers);
}

// ---------- admin API ----------
const COLS = ['services', 'industries', 'portfolio', 'posts', 'leads', 'subscribers'];
const NO_SLUG = ['leads', 'subscribers'];

async function prep(env, col, body, current) {
  const doc = { ...body };
  delete doc.id; delete doc.createdAt; delete doc.updatedAt;
  if (!NO_SLUG.includes(col)) {
    doc.slug = toSlug(doc.slug || doc.title) || store.newId();
    const all = await store.list(env, col);
    if (all.some(x => x.slug === doc.slug && x.id !== (current && current.id))) doc.slug += '-' + store.newId().slice(0, 4);
  }
  return doc;
}

const csvCell = (v) => { v = Array.isArray(v) ? v.join('; ') : String(v ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };

async function adminApi(req, env, url) {
  const seg = url.pathname.split('/').filter(Boolean).slice(2); // after /api/admin
  const m = req.method;
  const body = () => req.json().catch(() => ({}));

  if (seg[0] === 'content' && m === 'GET') return json(await store.load(env, { admin: true }));
  if (seg[0] === 'preview' && m === 'POST') return json({ html: md((await body()).md) });
  if (seg[0] === 'settings' && m === 'PUT') return json(await store.saveMeta(env, 'settings', await body()));
  if (seg[0] === 'sections' && seg[1] && m === 'PUT') {
    const db = await store.load(env);
    if (!db.sections[seg[1]]) return json({ error: 'Unknown section' }, 404);
    const value = await body();
    await store.saveMeta(env, 'sections', { ...db.sections, [seg[1]]: value });
    return json(value);
  }
  if (seg[0] === 'upload' && m === 'POST') {
    const form = await req.formData().catch(() => null);
    const f = form && form.get('file');
    if (!f || typeof f === 'string' || !MEDIA_TYPES.test(f.type) || f.size > 8 * 1024 * 1024)
      return json({ error: 'Upload an image (png, jpg, webp, gif, avif, svg) or PDF up to 8MB.' }, 400);
    const dot = f.name.lastIndexOf('.');
    const name = Date.now().toString(36) + '-' + toSlug(dot > 0 ? f.name.slice(0, dot) : f.name).slice(0, 40) + (dot > 0 ? f.name.slice(dot).toLowerCase().replace(/[^.a-z0-9]/g, '') : '');
    await env.MEDIA.put(name, await f.arrayBuffer(), { metadata: { type: f.type, size: f.size, mtime: Date.now() } });
    return json({ url: '/uploads/' + name });
  }
  if (seg[0] === 'media' && m === 'GET') {
    const out = []; let cursor;
    do { const r = await env.MEDIA.list({ cursor }); out.push(...r.keys); cursor = r.list_complete ? null : r.cursor; } while (cursor);
    return json(out.map(k => ({ url: '/uploads/' + k.name, mtime: (k.metadata && k.metadata.mtime) || 0 })).sort((a, b) => b.mtime - a.mtime));
  }
  if (seg[0] === 'media' && seg[1] && m === 'DELETE') { await env.MEDIA.delete(decodeURIComponent(seg[1])); return json({ ok: true }); }
  if (seg[0] === 'export' && seg[1] === 'leads.csv') {
    const cols = ['createdAt', 'status', 'name', 'email', 'phone', 'company', 'role', 'country', 'services', 'projectType', 'budget', 'timeline', 'contactPref', 'meetingTime', 'idea', 'notes', 'source'];
    const rows = (await store.list(env, 'leads')).map(l => cols.map(c => csvCell(l[c])).join(','));
    return respond([cols.join(','), ...rows].join('\n'), 200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="reown-leads.csv"' });
  }
  if (seg[0] === 'export' && seg[1] === 'subscribers.csv') {
    const rows = (await store.list(env, 'subscribers')).map(s => [s.email, s.name, s.status, s.source, s.createdAt].map(csvCell).join(','));
    return respond(['email,name,status,source,createdAt', ...rows].join('\n'), 200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="reown-subscribers.csv"' });
  }
  if (COLS.includes(seg[0])) {
    const col = seg[0], id = seg[1];
    if (!id && m === 'GET') return json(await store.list(env, col));
    if (!id && m === 'POST') return json(await store.insert(env, col, await prep(env, col, await body())));
    if (id && m === 'PUT') {
      const cur = await store.get(env, col, id);
      if (!cur) return json({ error: 'Not found' }, 404);
      return json(await store.update(env, col, id, await prep(env, col, await body(), cur)));
    }
    if (id && m === 'DELETE') return json({ ok: await store.remove(env, col, id) });
  }
  return json({ error: 'Not found' }, 404);
}

// ---------- main ----------
async function handle(req, env, ctx) {
  const url = new URL(req.url);
  const p = url.pathname;

  if (p === '/healthz') { await store.ensure(env); return text('ok'); }

  if (p.startsWith('/uploads/') && req.method === 'GET') {
    return (await serveMedia(env, decodeURIComponent(p.slice(9)))) || respond('Not found', 404);
  }

  // Same-origin check for state-changing requests (CSRF defence in depth)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.headers.get('Origin');
    if (origin && origin !== url.origin) return json({ error: 'Bad origin' }, 403);
  }

  if (p === '/api/contact' && req.method === 'POST') return contact(req, env, ctx);
  if (p === '/api/subscribe' && req.method === 'POST') return subscribe(req, env);

  // --- admin ---
  if (p === '/admin' || p === '/admin/') {
    const noindex = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };
    if (!(await isAdmin(req, env))) return html(render('admin/login', { error: url.searchParams.get('e') ? 'Invalid credentials' : '', disabled: !env.ADMIN_PASSWORD }), 200, noindex);
    return html(render('admin/app', { icons: icon.names }), 200, noindex);
  }
  if (p === '/admin/login' && req.method === 'POST') {
    const ip = req.headers.get('CF-Connecting-IP') || 'x';
    if (limited('l:' + ip, 8, 15 * 60 * 1000)) return respond('Too many attempts. Try again later.', 429);
    const f = await req.formData().catch(() => null);
    const user = f ? String(f.get('username') || '') : '', pass = f ? String(f.get('password') || '') : '';
    const okUser = await safeEq(user, env.ADMIN_USER || 'admin'), okPass = await safeEq(pass, env.ADMIN_PASSWORD || '\u0000never');
    if (env.ADMIN_PASSWORD && okUser && okPass) {
      return redirect('/admin', 303, { 'Set-Cookie': `${COOKIE}=${await makeSession(env)}; Max-Age=28800; ${cookieAttrs(url)}` });
    }
    return redirect('/admin?e=1', 303);
  }
  if (p === '/admin/logout' && req.method === 'POST') return redirect('/admin', 303, { 'Set-Cookie': `${COOKIE}=; Max-Age=0; ${cookieAttrs(url)}` });
  if (p.startsWith('/api/admin/')) {
    if (!(await isAdmin(req, env))) return json({ error: 'Unauthorized' }, 401);
    return adminApi(req, env, url);
  }

  // --- public pages ---
  if (req.method !== 'GET' && req.method !== 'HEAD') return respond('Method not allowed', 405);
  const db = await store.load(env);
  const c = makeCtx(req, env, db);
  const res = await publicRoute(req, env, ctx, c);
  if (res) return res;
  return c.page('404', { seo: c.seo({ title: 'Page not found', noindex: true }) }, 404);
}

export default {
  async fetch(req, env, ctx) {
    try {
      const url = new URL(req.url);
      // One canonical host: reownltd.com → https://www.reownltd.com (keeps path + query)
      const canonical = env.SITE_URL ? new URL(env.SITE_URL) : null;
      // Always HTTPS on the real domain (localhost dev stays on http)
      if (url.protocol === 'http:' && canonical && url.hostname.endsWith(canonical.hostname.replace(/^www\./, ''))) {
        return Response.redirect(canonical.origin + url.pathname + url.search, 301);
      }
      if (canonical && url.hostname !== canonical.hostname && url.hostname === canonical.hostname.replace(/^www\./, '')) {
        return Response.redirect(canonical.origin + url.pathname + url.search, 301);
      }
      const res = await handle(req, env, ctx);
      // Keep the temporary *.workers.dev address out of search results
      if (url.hostname.endsWith('.workers.dev')) {
        const out = new Response(res.body, res);
        out.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return out;
      }
      return res;
    } catch (err) {
      console.error(err && err.stack || err);
      if (new URL(req.url).pathname.startsWith('/api/')) return json({ error: 'Server error' }, 500);
      return html('<h1>Something went wrong</h1><p>Please try again shortly.</p>', 500);
    }
  },
};
