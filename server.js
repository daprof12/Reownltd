require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const compression = require('compression');
const multer = require('multer');
const { marked } = require('marked');
const slugify = require('slugify');
const store = require('./lib/store');
const icon = require('./lib/icons');

const app = express();
const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- Admin credentials ----------
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
let ADMIN_PASS = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASS) {
  if (PROD) console.warn('[admin] ADMIN_PASSWORD is not set — admin login is disabled in production.');
  else { ADMIN_PASS = 'reown-admin'; console.warn('[admin] Using development password "reown-admin". Set ADMIN_PASSWORD in .env.'); }
}
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

// ---------- App setup ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(compression());
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: PROD ? '7d' : 0 }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: PROD ? '30d' : 0 }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: 'reown.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: PROD, maxAge: 1000 * 60 * 60 * 8 },
}));

// ---------- Helpers ----------
marked.setOptions({ gfm: true, breaks: false });
const md = (s) => marked.parse(s || '');
const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/[#*_>`\[\]]/g, '').replace(/\s+/g, ' ').trim();
const clip = (s, n = 160) => { s = strip(s); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const readTime = (s) => Math.max(1, Math.round(strip(s).split(' ').length / 220));
const slug = (s) => slugify(String(s || ''), { lower: true, strict: true }).slice(0, 80);
const baseUrl = (req) => (process.env.SITE_URL || store.db().settings.siteUrl || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
const abs = (req, p) => (!p ? '' : /^https?:/.test(p) ? p : baseUrl(req) + (p.startsWith('/') ? p : '/' + p));
const published = (col) => store.list(col).filter(x => x.published);
const services = () => published('services').sort((a, b) => (a.order || 0) - (b.order || 0));
const posts = () => published('posts').sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
const industries = () => published('industries').sort((a, b) => (a.order || 0) - (b.order || 0));

// Common locals for every public view
app.use((req, res, next) => {
  const db = store.db();
  res.locals.s = db.settings;
  res.locals.sec = db.sections;
  res.locals.navServices = services();
  res.locals.navIndustries = industries();
  res.locals.icon = icon;
  res.locals.md = md;
  res.locals.clip = clip;
  res.locals.fmtDate = fmtDate;
  res.locals.readTime = readTime;
  res.locals.path = req.path;
  res.locals.year = new Date().getFullYear();
  next();
});

// Build SEO object for a page
function seo(req, { title, description, image, type = 'website', jsonLd = [], noindex = false, crumbs } = {}) {
  const s = store.db().settings;
  const url = baseUrl(req) + req.path.replace(/\/$/, '');
  const org = {
    '@type': 'Organization',
    '@id': baseUrl(req) + '/#organization',
    name: s.siteName,
    legalName: s.siteName,
    url: baseUrl(req),
    identifier: s.rcNumber ? { '@type': 'PropertyValue', propertyID: 'CAC RC Number', value: 'RC ' + s.rcNumber } : undefined,
    areaServed: 'Worldwide',
    logo: abs(req, '/img/logo-full.webp'),
    slogan: s.tagline,
    description: s.seo.description,
    email: s.email || undefined,
    telephone: s.phone || undefined,
    address: s.postal && s.postal.street
      ? { '@type': 'PostalAddress', streetAddress: s.postal.street, addressLocality: s.postal.locality, addressRegion: s.postal.region, addressCountry: s.postal.country }
      : (s.address || undefined),
    sameAs: Object.values(s.social || {}).filter(Boolean),
    contactPoint: s.email ? [{ '@type': 'ContactPoint', contactType: 'sales', email: s.email, telephone: s.phone || undefined, availableLanguage: ['English'] }] : undefined,
  };
  const graph = [org, ...jsonLd];
  if (crumbs) graph.push({
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', url: '/' }, ...crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(req, c.url) })),
  });
  return {
    title: title ? `${title} | ${s.siteName}` : s.seo.title,
    description: clip(description || s.seo.description, 160),
    keywords: s.seo.keywords,
    canonical: url || baseUrl(req) + '/',
    image: abs(req, image || s.seo.ogImage),
    type, noindex,
    jsonLd: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c'),
  };
}

// ---------- Public routes ----------
app.get('/', (req, res) => {
  const db = store.db();
  const s = db.settings;
  const jsonLd = [
    { '@type': 'WebSite', '@id': baseUrl(req) + '/#website', url: baseUrl(req), name: s.siteName, publisher: { '@id': baseUrl(req) + '/#organization' } },
    {
      '@type': 'ItemList', name: 'Services',
      itemListElement: services().map((sv, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Service', name: sv.title, description: sv.summary, url: abs(req, '/services/' + sv.slug), provider: { '@id': baseUrl(req) + '/#organization' } } })),
    },
  ];
  if (db.sections.faq.enabled) jsonLd.push({
    '@type': 'FAQPage',
    mainEntity: db.sections.faq.items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });
  res.render('index', {
    seo: seo(req, { jsonLd }),
    services: services(),
    projects: published('portfolio').sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 6),
    posts: posts().slice(0, 3),
  });
});

app.get('/services', (req, res) => res.redirect(301, '/#services'));
app.get('/services/:slug', (req, res, next) => {
  const sv = services().find(x => x.slug === req.params.slug);
  if (!sv) return next();
  res.render('service', {
    sv, services: services(),
    projects: published('portfolio').slice(0, 3),
    seo: seo(req, {
      title: sv.title, description: sv.summary,
      jsonLd: [{ '@type': 'Service', name: sv.title, description: sv.summary, serviceType: sv.title, provider: { '@id': baseUrl(req) + '/#organization' }, areaServed: 'Worldwide' }],
      crumbs: [{ name: 'Services', url: '/#services' }, { name: sv.title, url: '/services/' + sv.slug }],
    }),
  });
});

app.get('/industries', (req, res) => {
  res.render('industries', {
    list: industries(),
    seo: seo(req, {
      title: 'Industries We Serve',
      description: 'Reown builds AI, software, mobile, blockchain, IoT and cybersecurity solutions for government, finance, healthcare, education, logistics, retail, energy and enterprise.',
      jsonLd: [{ '@type': 'ItemList', name: 'Industries', itemListElement: industries().map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.title, url: abs(req, '/industries/' + x.slug) })) }],
      crumbs: [{ name: 'Industries', url: '/industries' }],
    }),
  });
});

app.get('/industries/:slug', (req, res, next) => {
  const ind = industries().find(x => x.slug === req.params.slug);
  if (!ind) return next();
  const svcs = services();
  const related = (ind.services || []).map(sl => svcs.find(s => s.slug === sl)).filter(Boolean);
  const kw = ind.title.split(/[ &]+/)[0].toLowerCase();
  const projects = published('portfolio').filter(p => p.industry && (p.industry.toLowerCase().includes(kw) || ind.title.toLowerCase().includes(p.industry.toLowerCase()))).slice(0, 3);
  res.render('industry', {
    ind, related, projects, others: industries().filter(x => x.id !== ind.id),
    seo: seo(req, {
      title: ind.seoTitle || `${ind.title} Software Solutions`, description: ind.seoDescription || ind.summary,
      jsonLd: [{
        '@type': 'Service', name: `${ind.title} technology solutions`, description: ind.summary, serviceType: ind.title,
        provider: { '@id': baseUrl(req) + '/#organization' }, audience: { '@type': 'BusinessAudience', name: ind.title },
        hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Solutions', itemListElement: (ind.solutions || []).map(x => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: x } })) },
      }],
      crumbs: [{ name: 'Industries', url: '/industries' }, { name: ind.title, url: '/industries/' + ind.slug }],
    }),
  });
});

app.get('/resources/digital-transformation-checklist', (req, res) => {
  res.render('checklist', { seo: seo(req, { title: 'Digital Transformation Checklist', description: 'A free, practical 25-point checklist to plan, build and secure your organisation’s digital transformation — from strategy and data to AI, security and people.', crumbs: [{ name: 'Resources', url: '/resources/digital-transformation-checklist' }] }) });
});

app.get('/portfolio', (req, res) => {
  const all = published('portfolio');
  const cats = [...new Set(all.map(p => p.category).filter(Boolean))];
  res.render('portfolio', {
    projects: all, cats,
    seo: seo(req, {
      title: 'Portfolio & Case Studies',
      description: 'Explore Reown projects across AI, web, mobile, desktop, blockchain, IoT and cybersecurity for government, enterprise and business clients.',
      crumbs: [{ name: 'Portfolio', url: '/portfolio' }],
    }),
  });
});

app.get('/portfolio/:slug', (req, res, next) => {
  const p = published('portfolio').find(x => x.slug === req.params.slug);
  if (!p) return next();
  const others = published('portfolio').filter(x => x.id !== p.id).slice(0, 3);
  res.render('project', {
    p, others,
    seo: seo(req, {
      title: p.title, description: p.summary, image: p.cover, type: 'article',
      jsonLd: [{ '@type': 'CreativeWork', name: p.title, description: p.summary, about: p.industry, keywords: (p.tags || []).join(', '), dateCreated: p.year, creator: { '@id': baseUrl(req) + '/#organization' }, image: p.cover ? abs(req, p.cover) : undefined }],
      crumbs: [{ name: 'Portfolio', url: '/portfolio' }, { name: p.title, url: '/portfolio/' + p.slug }],
    }),
  });
});

app.get('/blog', (req, res) => {
  const all = posts();
  const cats = [...new Set(all.map(p => p.category).filter(Boolean))];
  const cat = req.query.category || '';
  const q = String(req.query.q || '').toLowerCase().slice(0, 80);
  let list = all.filter(p => (!cat || p.category === cat) && (!q || (p.title + ' ' + p.excerpt + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(q)));
  const per = 9, page = Math.max(1, parseInt(req.query.page) || 1), pages = Math.max(1, Math.ceil(list.length / per));
  list = list.slice((page - 1) * per, page * per);
  res.render('blog', {
    list, cats, cat, q, page, pages,
    seo: seo(req, {
      title: cat ? `${cat} Articles` : 'Blog & Insights',
      description: 'Insights, guides and news from Reown on AI, software development, automation, blockchain, cybersecurity and digital transformation.',
      noindex: !!q,
      crumbs: [{ name: 'Blog', url: '/blog' }],
    }),
  });
});

app.get('/blog/:slug', (req, res, next) => {
  const p = posts().find(x => x.slug === req.params.slug);
  if (!p) return next();
  const related = posts().filter(x => x.id !== p.id && (x.category === p.category || (x.tags || []).some(t => (p.tags || []).includes(t)))).slice(0, 3);
  res.render('post', {
    p, related,
    seo: seo(req, {
      title: p.seoTitle || p.title, description: p.seoDescription || p.excerpt, image: p.cover, type: 'article',
      jsonLd: [{
        '@type': 'BlogPosting', headline: p.title, description: p.excerpt, datePublished: p.publishedAt, dateModified: p.updatedAt || p.publishedAt,
        author: { '@type': 'Organization', name: p.author || store.db().settings.siteName }, publisher: { '@id': baseUrl(req) + '/#organization' },
        image: abs(req, p.cover || store.db().settings.seo.ogImage), mainEntityOfPage: baseUrl(req) + '/blog/' + p.slug, keywords: (p.tags || []).join(', '), articleSection: p.category,
      }],
      crumbs: [{ name: 'Blog', url: '/blog' }, { name: p.title, url: '/blog/' + p.slug }],
    }),
  });
});

// ---------- Lead capture ----------
const hits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  return arr.length > max;
}
const str = (v, n) => String(v ?? '').trim().slice(0, n);

app.post('/api/contact', async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  if (rateLimit('c:' + req.ip, 5, 10 * 60 * 1000)) return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  const lead = {
    name: str(b.name, 120), email: str(b.email, 160).toLowerCase(), phone: str(b.phone, 40), company: str(b.company, 160),
    role: str(b.role, 120), country: str(b.country, 80),
    services: Array.isArray(b.services) ? b.services.map(x => str(x, 80)).slice(0, 12) : [],
    projectType: str(b.projectType, 80), idea: str(b.idea, 5000), budget: str(b.budget, 60), timeline: str(b.timeline, 60),
    contactPref: str(b.contactPref, 40), meetingTime: str(b.meetingTime, 120), source: str(b.source, 200),
    status: 'new', notes: '',
  };
  if (!lead.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || lead.idea.length < 10)
    return res.status(400).json({ ok: false, error: 'Please provide your name, a valid email and a short description of your idea.' });
  const saved = store.insert('leads', lead);
  notify(saved).catch(e => console.error('[mail]', e.message));
  res.json({ ok: true, bookingUrl: store.db().settings.bookingUrl || '' });
});

app.post('/api/subscribe', (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true });
  if (rateLimit('s:' + req.ip, 5, 10 * 60 * 1000)) return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  const email = str(b.email, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  if (!store.list('subscribers').some(x => x.email === email)) {
    store.insert('subscribers', { email, name: str(b.name, 120), source: str(b.source, 200), status: 'active' });
  }
  const n = store.db().settings.newsletter || {};
  res.json({ ok: true, leadMagnetUrl: n.leadMagnetUrl || '', leadMagnetTitle: n.leadMagnetTitle || '' });
});

async function notify(lead) {
  if (!process.env.SMTP_HOST) return;
  const nodemailer = require('nodemailer');
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587, secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  const to = process.env.LEADS_TO || store.db().settings.email;
  const lines = Object.entries(lead).filter(([k, v]) => v && !['id', 'updatedAt', 'notes', 'status'].includes(k)).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
  await t.sendMail({ from: process.env.SMTP_FROM || to, to, replyTo: lead.email, subject: `New project enquiry — ${lead.name}${lead.company ? ' (' + lead.company + ')' : ''}`, text: lines.join('\n') });
}

app.get('/healthz', (req, res) => { store.db(); res.type('text/plain').send('ok'); });

// ---------- SEO files ----------
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${baseUrl(req)}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const b = baseUrl(req);
  const urls = [
    { loc: '/', pr: '1.0', cf: 'weekly' },
    { loc: '/portfolio', pr: '0.8', cf: 'weekly' },
    { loc: '/blog', pr: '0.8', cf: 'daily' },
    { loc: '/industries', pr: '0.8', cf: 'monthly' },
    { loc: '/resources/digital-transformation-checklist', pr: '0.6', cf: 'yearly' },
    ...services().map(x => ({ loc: '/services/' + x.slug, pr: '0.9', cf: 'monthly', lm: x.updatedAt })),
    ...industries().map(x => ({ loc: '/industries/' + x.slug, pr: '0.85', cf: 'monthly', lm: x.updatedAt })),
    ...published('portfolio').map(x => ({ loc: '/portfolio/' + x.slug, pr: '0.7', cf: 'monthly', lm: x.updatedAt })),
    ...posts().map(x => ({ loc: '/blog/' + x.slug, pr: '0.7', cf: 'monthly', lm: x.updatedAt || x.publishedAt })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u =>
    `  <url><loc>${b}${u.loc}</loc>${u.lm ? `<lastmod>${new Date(u.lm).toISOString().slice(0, 10)}</lastmod>` : ''}<changefreq>${u.cf}</changefreq><priority>${u.pr}</priority></url>`).join('\n')}\n</urlset>`;
  res.type('application/xml').send(xml);
});

const xmlEsc = (s) => String(s || '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
app.get('/rss.xml', (req, res) => {
  const b = baseUrl(req), s = store.db().settings;
  const items = posts().slice(0, 20).map(p => `<item><title>${xmlEsc(p.title)}</title><link>${b}/blog/${p.slug}</link><guid>${b}/blog/${p.slug}</guid><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate><description>${xmlEsc(p.excerpt)}</description><category>${xmlEsc(p.category)}</category></item>`).join('');
  res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xmlEsc(s.siteName)} Blog</title><link>${b}/blog</link><description>${xmlEsc(s.seo.description)}</description><language>en</language>${items}</channel></rss>`);
});

app.get('/manifest.webmanifest', (req, res) => {
  const s = store.db().settings;
  res.type('application/manifest+json').json({
    name: s.siteName, short_name: 'Reown', start_url: '/', display: 'standalone', background_color: '#F8FAFF', theme_color: '#0B1F5B',
    icons: [{ src: '/img/logo-mark.webp', sizes: '1536x1024', type: 'image/webp' }],
  });
});

// ---------- Admin ----------
const requireAuth = (req, res, next) => req.session.admin ? next() : res.status(401).json({ error: 'Unauthorized' });

app.get('/admin', (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  if (!req.session.admin) return res.render('admin/login', { error: req.query.e ? 'Invalid credentials' : '', disabled: !ADMIN_PASS });
  res.render('admin/app', { icons: icon.names });
});

app.post('/admin/login', (req, res) => {
  if (rateLimit('l:' + req.ip, 8, 15 * 60 * 1000)) return res.status(429).send('Too many attempts. Try again later.');
  const { username, password } = req.body;
  if (ADMIN_PASS && safeEq(username || '', ADMIN_USER) && safeEq(password || '', ADMIN_PASS)) {
    return req.session.regenerate(() => { req.session.admin = true; res.redirect('/admin'); });
  }
  res.redirect('/admin?e=1');
});
app.post('/admin/logout', (req, res) => req.session.destroy(() => res.redirect('/admin')));

const api = express.Router();
api.use(requireAuth);
api.get('/content', (req, res) => res.json(store.db()));
api.post('/preview', (req, res) => res.json({ html: md(req.body.md) }));
api.put('/settings', (req, res) => { store.db().settings = req.body; store.save(); res.json(store.db().settings); });
api.put('/sections/:key', (req, res) => {
  const db = store.db();
  if (!db.sections[req.params.key]) return res.status(404).json({ error: 'Unknown section' });
  db.sections[req.params.key] = req.body; store.save(); res.json(req.body);
});
const COLS = ['services', 'industries', 'portfolio', 'posts', 'leads', 'subscribers'];
const NO_SLUG = ['leads', 'subscribers'];
api.param('col', (req, res, next, col) => COLS.includes(col) ? next() : res.status(404).json({ error: 'Unknown collection' }));
function prep(col, body, current) {
  const doc = { ...body };
  delete doc.id; delete doc.createdAt; delete doc.updatedAt;
  if (!NO_SLUG.includes(col)) {
    doc.slug = slug(doc.slug || doc.title) || store.id();
    const clash = store.list(col).find(x => x.slug === doc.slug && x.id !== current?.id);
    if (clash) doc.slug += '-' + store.id().slice(0, 4);
  }
  return doc;
}
api.get('/:col', (req, res) => res.json(store.list(req.params.col)));
api.post('/:col', (req, res) => res.json(store.insert(req.params.col, prep(req.params.col, req.body))));
api.put('/:col/:id', (req, res) => {
  const cur = store.get(req.params.col, req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  res.json(store.update(req.params.col, req.params.id, prep(req.params.col, req.body, cur)));
});
api.delete('/:col/:id', (req, res) => res.json({ ok: store.remove(req.params.col, req.params.id) }));

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, f, cb) => cb(null, Date.now().toString(36) + '-' + slug(path.parse(f.originalname).name).slice(0, 40) + path.extname(f.originalname).toLowerCase()),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /^(image\/(png|jpe?g|webp|gif|avif|svg\+xml)|application\/pdf)$/.test(f.mimetype)),
});
api.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload an image (png, jpg, webp, gif, avif, svg) or PDF up to 8MB.' });
  res.json({ url: '/uploads/' + req.file.filename });
});
api.get('/media', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR).filter(f => !f.startsWith('.')).map(f => ({ url: '/uploads/' + f, mtime: fs.statSync(path.join(UPLOAD_DIR, f)).mtimeMs })).sort((a, b) => b.mtime - a.mtime);
  res.json(files);
});
api.delete('/media/:name', (req, res) => {
  const f = path.join(UPLOAD_DIR, path.basename(req.params.name));
  if (fs.existsSync(f)) fs.unlinkSync(f);
  res.json({ ok: true });
});
api.get('/export/leads.csv', (req, res) => {
  const cols = ['createdAt', 'status', 'name', 'email', 'phone', 'company', 'role', 'country', 'services', 'projectType', 'budget', 'timeline', 'contactPref', 'meetingTime', 'idea', 'notes', 'source'];
  const esc = (v) => { v = Array.isArray(v) ? v.join('; ') : String(v ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
  const csv = [cols.join(','), ...store.list('leads').map(l => cols.map(c => esc(l[c])).join(','))].join('\n');
  res.attachment('reown-leads.csv').type('text/csv').send(csv);
});
api.get('/export/subscribers.csv', (req, res) => {
  const csv = ['email,name,status,source,createdAt', ...store.list('subscribers').map(s => [s.email, s.name, s.status, s.source, s.createdAt].map(v => '"' + String(v ?? '').replace(/^([=+\-@])/, "'$1").replace(/"/g, '""') + '"').join(','))].join('\n');
  res.attachment('reown-subscribers.csv').type('text/csv').send(csv);
});
app.use('/api/admin', api);

// ---------- 404 / errors ----------
app.use((req, res) => res.status(404).render('404', { seo: seo(req, { title: 'Page not found', noindex: true }) }));
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ error: err.message || 'Server error' });
  res.status(500).send('Something went wrong.');
});

app.listen(PORT, () => console.log(`Reown site running at http://localhost:${PORT}  (CMS: /admin)`));
