/* Reown CMS — single-page admin (no build step) */
(function () {
  'use strict';
  var d = document;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var DB = null;

  // ---------- utils ----------
  function h(tag, attrs, kids) {
    var el = d.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? d.createTextNode(c) : c); });
    return el;
  }
  function api(method, url, body) {
    return fetch('/api/admin' + url, { method: method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' })
      .then(function (r) {
        if (r.status === 401) { location.href = '/admin'; throw new Error('Signed out'); }
        return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Request failed'); return j; });
      });
  }
  function toast(msg, bad) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function fmt(dt) { return dt ? new Date(dt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function dialog(content) {
    var p = $('#dlgPanel'); p.innerHTML = ''; p.appendChild(content); $('#dlg').hidden = false;
  }
  function closeDialog() { $('#dlg').hidden = true; }
  d.addEventListener('click', function (e) { if (e.target.closest('[data-dlg-close]')) closeDialog(); });
  function setTitle(t, actions) {
    $('#pageTitle').textContent = t; var a = $('#topActions'); a.innerHTML = ''; (actions || []).forEach(function (x) { a.appendChild(x); });
    d.title = t + ' — Reown CMS';
  }

  // ---------- schemas ----------
  var ICON = { type: 'icon' };
  var S = {
    services: [
      { k: 'title', l: 'Title', req: true }, { k: 'slug', l: 'URL slug', hint: 'Leave empty to generate from title' },
      { k: 'icon', l: 'Icon', type: 'icon' }, { k: 'order', l: 'Display order', type: 'number' },
      { k: 'summary', l: 'Short summary (cards & meta description)', type: 'textarea', max: 200 },
      { k: 'features', l: 'Key features (one per line)', type: 'lines' },
      { k: 'body', l: 'Page content', type: 'markdown' },
      { k: 'published', l: 'Published', type: 'bool' },
    ],
    portfolio: [
      { k: 'title', l: 'Project title', req: true }, { k: 'slug', l: 'URL slug', hint: 'Leave empty to generate from title' },
      { k: 'client', l: 'Client' }, { k: 'industry', l: 'Industry' }, { k: 'category', l: 'Category / service (used for filters)' }, { k: 'year', l: 'Year' },
      { k: 'summary', l: 'Summary', type: 'textarea', max: 220 },
      { k: 'cover', l: 'Cover image', type: 'image' },
      { k: 'tags', l: 'Tags (comma separated)', type: 'tags' },
      { k: 'results', l: 'Key results', type: 'repeater', fields: [{ k: 'value', l: 'Value (e.g. 3x)' }, { k: 'label', l: 'Label' }] },
      { k: 'body', l: 'Case study content', type: 'markdown' },
      { k: 'featured', l: 'Featured on homepage', type: 'bool' }, { k: 'published', l: 'Published', type: 'bool' },
    ],
    posts: [
      { k: 'title', l: 'Title', req: true }, { k: 'slug', l: 'URL slug', hint: 'Leave empty to generate from title' },
      { k: 'category', l: 'Category' }, { k: 'author', l: 'Author' }, { k: 'publishedAt', l: 'Publish date', type: 'date' },
      { k: 'excerpt', l: 'Excerpt', type: 'textarea', max: 220 },
      { k: 'cover', l: 'Cover image', type: 'image' },
      { k: 'tags', l: 'Tags (comma separated)', type: 'tags' },
      { k: 'body', l: 'Article', type: 'markdown' },
      { k: 'seoTitle', l: 'SEO title (optional)', max: 60 }, { k: 'seoDescription', l: 'SEO description (optional)', type: 'textarea', max: 160 },
      { k: 'published', l: 'Published', type: 'bool' },
    ],
    industries: [
      { k: 'title', l: 'Industry name', req: true }, { k: 'slug', l: 'URL slug', hint: 'Leave empty to generate from name' },
      { k: 'icon', l: 'Icon', type: 'icon' }, { k: 'order', l: 'Display order', type: 'number' },
      { k: 'headline', l: 'Page headline' },
      { k: 'summary', l: 'Summary (cards & meta description)', type: 'textarea', max: 200 },
      { k: 'challenges', l: 'Challenges we solve (one per line)', type: 'lines' },
      { k: 'solutions', l: 'What we deliver (one per line)', type: 'lines' },
      { k: 'services', l: 'Related services', type: 'services' },
      { k: 'body', l: 'Page content', type: 'markdown' },
      { k: 'seoTitle', l: 'SEO title (optional)', max: 60 }, { k: 'seoDescription', l: 'SEO description (optional)', type: 'textarea', max: 160 },
      { k: 'published', l: 'Published', type: 'bool' },
    ],
    settings: [
      { type: 'heading', l: 'Company' },
      { k: 'siteName', l: 'Company name' }, { k: 'tagline', l: 'Tagline' },
      { k: 'siteUrl', l: 'Website URL (used for canonical links & sitemap)' },
      { k: 'email', l: 'Email' }, { k: 'phone', l: 'Phone' }, { k: 'whatsapp', l: 'WhatsApp number (international, shows chat button)' },
      { k: 'rcNumber', l: 'CAC RC number (digits only, shown as “RC …”)' },
      { k: 'address', l: 'Address (as shown on the website)' },
      { k: 'postal', l: 'Address for Google (structured data)', type: 'group', fields: [
        { k: 'street', l: 'Street / suite' }, { k: 'locality', l: 'Area / city' }, { k: 'region', l: 'State' }, { k: 'country', l: 'Country code (e.g. NG)' }] },
      { k: 'bookingUrl', l: 'Meeting booking link (Calendly, Google Calendar, Zoho…)' },
      { k: 'footerAbout', l: 'Footer description', type: 'textarea' },
      { k: 'newsletter', l: 'Newsletter & free resource', type: 'group', fields: [
        { k: 'enabled', l: 'Show newsletter sign-up forms', type: 'bool' }, { k: 'button', l: 'Button text' },
        { k: 'title', l: 'Heading' }, { k: 'leadMagnetTitle', l: 'Free resource name' },
        { k: 'text', l: 'Text', type: 'textarea' },
        { k: 'leadMagnetUrl', l: 'Free resource link (shown after subscribing) — page URL or upload a PDF', type: 'image', file: true }] },
      { k: 'social', l: 'Social profiles', type: 'group', fields: ['linkedin', 'x', 'facebook', 'instagram', 'github', 'youtube'].map(function (n) { return { k: n, l: n === 'x' ? 'X (Twitter)' : n[0].toUpperCase() + n.slice(1) }; }) },
      { k: 'seo', l: 'Default SEO', type: 'group', fields: [
        { k: 'title', l: 'Homepage title', max: 65 }, { k: 'description', l: 'Meta description', type: 'textarea', max: 160 },
        { k: 'keywords', l: 'Keywords', type: 'textarea' }, { k: 'ogImage', l: 'Social share image (1200×630 recommended)', type: 'image' },
        { k: 'twitterHandle', l: 'X/Twitter handle (e.g. @reownltd)' }] },
      { k: 'analytics', l: 'Analytics & verification', type: 'group', fields: [
        { k: 'gaId', l: 'Google Analytics 4 ID (G-XXXX)' }, { k: 'googleVerification', l: 'Google Search Console verification code' }, { k: 'bingVerification', l: 'Bing Webmaster verification code' }] },
    ],
  };
  var intro = [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'eyebrow', l: 'Eyebrow' }, { k: 'title', l: 'Title' }, { k: 'subtitle', l: 'Subtitle', type: 'textarea' }];
  var SECTIONS = {
    hero: { l: 'Hero', f: [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'eyebrow', l: 'Eyebrow badge' }, { k: 'title', l: 'Headline' }, { k: 'rotatingWords', l: 'Animated words (one per line)', type: 'lines' }, { k: 'subtitle', l: 'Sub-headline', type: 'textarea' }, { k: 'ctaPrimary', l: 'Primary button' }, { k: 'ctaSecondary', l: 'Secondary button' }, { k: 'trustLine', l: 'Trust line' }] },
    stats: { l: 'Stats counters', f: [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'items', l: 'Stats', type: 'repeater', fields: [{ k: 'value', l: 'Number', type: 'number' }, { k: 'suffix', l: 'Suffix (+, %, /7)' }, { k: 'label', l: 'Label' }] }] },
    about: { l: 'About us', f: [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'eyebrow', l: 'Eyebrow' }, { k: 'title', l: 'Title' }, { k: 'body', l: 'Text', type: 'markdown' }, { k: 'points', l: 'Bullet points (one per line)', type: 'lines' }, { k: 'mission', l: 'Mission', type: 'textarea' }, { k: 'vision', l: 'Vision', type: 'textarea' }, { k: 'values', l: 'Values (one per line)', type: 'lines' }] },
    servicesIntro: { l: 'Services heading', f: intro },
    industries: { l: 'Industries heading', f: [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'eyebrow', l: 'Eyebrow' }, { k: 'title', l: 'Title' }, { k: 'subtitle', l: 'Subtitle', type: 'textarea', hint: 'The industry cards come from the Industries menu in the sidebar.' }] },
    process: { l: 'Process', f: [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'eyebrow', l: 'Eyebrow' }, { k: 'title', l: 'Title' }, { k: 'items', l: 'Steps', type: 'repeater', fields: [{ k: 'title', l: 'Title' }, { k: 'text', l: 'Text', type: 'textarea' }] }] },
    portfolioIntro: { l: 'Portfolio heading', f: intro },
    whyUs: { l: 'Why choose us', f: [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'eyebrow', l: 'Eyebrow' }, { k: 'title', l: 'Title' }, { k: 'items', l: 'Reasons', type: 'repeater', fields: [{ k: 'icon', l: 'Icon', type: 'icon' }, { k: 'title', l: 'Title' }, { k: 'text', l: 'Text', type: 'textarea' }] }] },
    tech: { l: 'Technology marquee', f: [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'title', l: 'Title' }, { k: 'items', l: 'Technologies (one per line)', type: 'lines' }] },
    testimonials: { l: 'Testimonials', f: [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'eyebrow', l: 'Eyebrow' }, { k: 'title', l: 'Title' }, { k: 'items', l: 'Testimonials', type: 'repeater', fields: [{ k: 'quote', l: 'Quote', type: 'textarea' }, { k: 'name', l: 'Name' }, { k: 'role', l: 'Role & organisation' }] }] },
    cta: { l: 'Call to action', f: [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'title', l: 'Title' }, { k: 'body', l: 'Text', type: 'textarea' }, { k: 'button', l: 'Main button' }, { k: 'secondary', l: 'Booking button (shown if booking link set)' }] },
    blogIntro: { l: 'Blog heading', f: intro },
    faq: { l: 'FAQ', f: [{ k: 'enabled', l: 'Show this section', type: 'bool' }, { k: 'eyebrow', l: 'Eyebrow' }, { k: 'title', l: 'Title' }, { k: 'items', l: 'Questions', type: 'repeater', fields: [{ k: 'q', l: 'Question' }, { k: 'a', l: 'Answer', type: 'textarea' }] }] },
  };

  // ---------- form builder ----------
  // build(field, value) -> { el, get() }
  function build(f, v) {
    var t = f.type || 'text', input, get;
    var wrap = h('div', { class: 'f f-' + t });
    if (t === 'heading') { return { el: h('h3', { class: 'f-heading', text: f.l }), get: null }; }
    var label = h('label', { class: 'f-label', text: f.l + (f.req ? ' *' : '') });
    if (t !== 'bool') wrap.appendChild(label);

    if (t === 'text' || t === 'number' || t === 'date') {
      input = h('input', { type: t, value: v == null ? '' : (t === 'date' ? String(v).slice(0, 10) : v), required: f.req, maxlength: null });
      wrap.appendChild(input);
      get = function () { return t === 'number' ? (input.value === '' ? 0 : +input.value) : input.value.trim(); };
    } else if (t === 'textarea') {
      input = h('textarea', { rows: 3 }); input.value = v || ''; wrap.appendChild(input);
      get = function () { return input.value.trim(); };
    } else if (t === 'lines' || t === 'tags') {
      var sep = t === 'lines' ? '\n' : ', ';
      input = h(t === 'lines' ? 'textarea' : 'input', { rows: 4 }); input.value = (v || []).join(sep); wrap.appendChild(input);
      get = function () { return input.value.split(t === 'lines' ? /\n/ : /,/).map(function (x) { return x.trim(); }).filter(Boolean); };
    } else if (t === 'bool') {
      input = h('input', { type: 'checkbox' }); input.checked = !!v;
      wrap.appendChild(h('label', { class: 'switch' }, [input, h('span', { class: 'sw' }), h('span', { text: f.l })]));
      get = function () { return input.checked; };
    } else if (t === 'services') {
      var cbs = (DB.services || []).map(function (sv) {
        var cb = h('input', { type: 'checkbox', value: sv.slug }); cb.checked = (v || []).indexOf(sv.slug) > -1;
        return h('label', { class: 'cb' }, [cb, ' ' + sv.title]);
      });
      wrap.appendChild(h('div', { class: 'cb-grid' }, cbs));
      get = function () { return cbs.map(function (l) { return l.firstChild; }).filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); };
    } else if (t === 'icon') {
      input = h('select'); (window.ICONS || []).forEach(function (n) { var o = h('option', { value: n, text: n }); if (n === v) o.selected = true; input.appendChild(o); });
      wrap.appendChild(input); get = function () { return input.value; };
    } else if (t === 'image') {
      input = h('input', { type: 'text', value: v || '', placeholder: '/uploads/… or https://…' });
      var prev = h('div', { class: 'img-prev', hidden: !!f.file });
      var upd = function () { prev.innerHTML = ''; if (input.value && !f.file) prev.appendChild(h('img', { src: input.value, alt: '' })); };
      input.addEventListener('input', upd); upd();
      var fileIn = h('input', { type: 'file', accept: f.file ? 'image/*,application/pdf' : 'image/*', hidden: true, onchange: function () { uploadFile(fileIn.files[0]).then(function (u) { input.value = u; upd(); }); } });
      wrap.appendChild(h('div', { class: 'img-row' }, [prev, h('div', { class: 'img-ctl' }, [input, h('div', { class: 'row' }, [
        h('button', { type: 'button', class: 'btn btn-sm', text: 'Upload', onclick: function () { fileIn.click(); } }),
        h('button', { type: 'button', class: 'btn btn-sm btn-ghost', text: 'Library', onclick: function () { pickMedia(function (u) { input.value = u; upd(); }); } }),
        h('button', { type: 'button', class: 'btn btn-sm btn-ghost', text: 'Clear', onclick: function () { input.value = ''; upd(); } }),
      ]), fileIn])]));
      get = function () { return input.value.trim(); };
    } else if (t === 'markdown') {
      input = h('textarea', { rows: 16, class: 'md' }); input.value = v || '';
      var pv = h('div', { class: 'md-preview prose', hidden: true });
      var wrapIns = function (a, b) { var s = input.selectionStart, e = input.selectionEnd, sel = input.value.slice(s, e); input.setRangeText(a + (sel || '') + (b || ''), s, e, 'end'); input.focus(); };
      var line = function (p) { var s = input.value.lastIndexOf('\n', input.selectionStart - 1) + 1; input.setRangeText(p, s, s, 'end'); input.focus(); };
      var mdFile = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: function () { uploadFile(mdFile.files[0]).then(function (u) { wrapIns('![image](' + u + ')'); }); } });
      var tb = h('div', { class: 'md-tools' }, [
        ['B', function () { wrapIns('**', '**'); }], ['I', function () { wrapIns('_', '_'); }], ['H2', function () { line('## '); }], ['H3', function () { line('### '); }],
        ['• List', function () { line('- '); }], ['1. List', function () { line('1. '); }], ['❝ Quote', function () { line('> '); }],
        ['Link', function () { var u = prompt('Link URL'); if (u) wrapIns('[', '](' + u + ')'); }], ['Image', function () { mdFile.click(); }],
      ].map(function (b) { return h('button', { type: 'button', class: 'tb', text: b[0], onclick: b[1] }); }));
      var tgl = h('button', { type: 'button', class: 'tb tb-r', text: 'Preview', onclick: function () {
        if (pv.hidden) api('POST', '/preview', { md: input.value }).then(function (r) { pv.innerHTML = r.html; pv.hidden = false; input.hidden = true; tgl.textContent = 'Edit'; });
        else { pv.hidden = true; input.hidden = false; tgl.textContent = 'Preview'; }
      } });
      tb.appendChild(tgl);
      wrap.appendChild(tb); wrap.appendChild(input); wrap.appendChild(pv); wrap.appendChild(mdFile);
      wrap.appendChild(h('p', { class: 'hint', text: 'Markdown supported: ## Heading, **bold**, - list, [link](url)' }));
      get = function () { return input.value; };
    } else if (t === 'group') {
      var box = h('div', { class: 'group' }), parts = f.fields.map(function (sf) { var b = build(sf, (v || {})[sf.k]); box.appendChild(b.el); return [sf, b]; });
      wrap.appendChild(box);
      get = function () { var o = {}; parts.forEach(function (p) { if (p[1].get) o[p[0].k] = p[1].get(); }); return o; };
    } else if (t === 'repeater') {
      var list = h('div', { class: 'rep' }), rows = [];
      var addRow = function (val) {
        var card = h('div', { class: 'rep-item' }), parts2 = f.fields.map(function (sf) { var b = build(sf, (val || {})[sf.k]); card.appendChild(b.el); return [sf, b]; });
        var row = { card: card, get: function () { var o = {}; parts2.forEach(function (p) { o[p[0].k] = p[1].get(); }); return o; } };
        card.appendChild(h('div', { class: 'rep-ctl' }, [
          h('button', { type: 'button', class: 'tb', text: '↑', title: 'Move up', onclick: function () { var i = rows.indexOf(row); if (i > 0) { rows.splice(i, 1); rows.splice(i - 1, 0, row); list.insertBefore(card, card.previousSibling); } } }),
          h('button', { type: 'button', class: 'tb', text: '↓', title: 'Move down', onclick: function () { var i = rows.indexOf(row); if (i < rows.length - 1) { rows.splice(i, 1); rows.splice(i + 1, 0, row); list.insertBefore(card.nextSibling, card); } } }),
          h('button', { type: 'button', class: 'tb danger', text: 'Remove', onclick: function () { rows.splice(rows.indexOf(row), 1); card.remove(); } }),
        ]));
        rows.push(row); list.appendChild(card);
      };
      (v || []).forEach(addRow);
      wrap.appendChild(list);
      wrap.appendChild(h('button', { type: 'button', class: 'btn btn-sm btn-ghost', text: '+ Add item', onclick: function () { addRow({}); } }));
      get = function () { return rows.map(function (r) { return r.get(); }); };
    }
    if (f.max && input) {
      var cnt = h('span', { class: 'count' }); wrap.appendChild(cnt);
      var upc = function () { var n = input.value.length; cnt.textContent = n + ' / ' + f.max + ' recommended'; cnt.classList.toggle('over', n > f.max); };
      input.addEventListener('input', upc); upc();
    }
    if (f.hint) wrap.appendChild(h('p', { class: 'hint', text: f.hint }));
    return { el: wrap, get: get };
  }
  function form(fields, data, onSave, extra) {
    var el = h('form', { class: 'card form', novalidate: true }), parts = [];
    fields.forEach(function (f) { var b = build(f, data[f.k]); el.appendChild(b.el); if (b.get) parts.push([f, b]); });
    var save = h('button', { class: 'btn btn-primary', type: 'submit', text: 'Save changes' });
    el.appendChild(h('div', { class: 'form-actions' }, [save].concat(extra || [])));
    el.addEventListener('submit', function (e) {
      e.preventDefault();
      var out = clone(data);
      parts.forEach(function (p) { out[p[0].k] = p[1].get(); });
      var miss = fields.filter(function (f) { return f.req && !out[f.k]; });
      if (miss.length) return toast(miss[0].l + ' is required', true);
      save.disabled = true; save.textContent = 'Saving…';
      Promise.resolve(onSave(out)).then(function () { toast('Saved ✓'); }).catch(function (err) { toast(err.message, true); })
        .finally(function () { save.disabled = false; save.textContent = 'Save changes'; });
    });
    return el;
  }

  // ---------- media ----------
  function uploadFile(file) {
    if (!file) return Promise.reject();
    var fd = new FormData(); fd.append('file', file);
    toast('Uploading…');
    return fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'same-origin' }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); toast('Uploaded ✓'); return j.url; }); })
      .catch(function (e) { toast(e.message || 'Upload failed', true); throw e; });
  }
  function pickMedia(cb) {
    api('GET', '/media').then(function (files) {
      var grid = h('div', { class: 'media-grid' }, files.map(function (f) {
        return h('button', { type: 'button', class: 'media-item', onclick: function () { cb(f.url); closeDialog(); } }, [h('img', { src: f.url, alt: '', loading: 'lazy' })]);
      }));
      dialog(h('div', {}, [h('h2', { text: 'Choose an image' }), files.length ? grid : h('p', { class: 'muted', text: 'No uploads yet — use Upload first.' }), h('button', { class: 'btn btn-ghost', 'data-dlg-close': true, text: 'Cancel' })]));
    });
  }

  // ---------- views ----------
  var views = {};

  views[''] = function (v) {
    setTitle('Dashboard');
    var leads = DB.leads, nw = leads.filter(function (l) { return l.status === 'new'; }).length;
    var stat = function (n, l, href) { return h('a', { class: 'stat card', href: href }, [h('strong', { text: String(n) }), h('span', { text: l })]); };
    v.appendChild(h('div', { class: 'stats' }, [
      stat(nw, 'New leads', '#/leads'), stat(leads.length, 'Total leads', '#/leads'),
      stat(DB.subscribers.length, 'Subscribers', '#/subscribers'), stat(DB.posts.length, 'Blog posts', '#/posts'),
    ]));
    var recent = h('div', { class: 'card' }, [h('h2', { text: 'Recent enquiries' })]);
    if (!leads.length) recent.appendChild(h('p', { class: 'muted', text: 'No enquiries yet. They will appear here when visitors submit the project form.' }));
    leads.slice(0, 6).forEach(function (l) {
      recent.appendChild(h('a', { class: 'lead-row', href: '#/leads/' + l.id }, [h('span', { class: 'st st-' + l.status, text: l.status }), h('strong', { text: l.name }), h('span', { class: 'muted', text: (l.company || l.email) }), h('span', { class: 'muted small', text: fmt(l.createdAt) })]));
    });
    var quick = h('div', { class: 'card' }, [h('h2', { text: 'Quick actions' }), h('div', { class: 'quick' }, [
      h('a', { class: 'btn', href: '#/posts/new', text: '+ New blog post' }), h('a', { class: 'btn', href: '#/portfolio/new', text: '+ New project' }),
      h('a', { class: 'btn btn-ghost', href: '#/sections', text: 'Edit homepage' }), h('a', { class: 'btn btn-ghost', href: '#/settings', text: 'SEO settings' }),
    ]), h('h3', { text: 'SEO checklist' }), h('ul', { class: 'checklist' }, [
      ['Set your real website URL', !!DB.settings.siteUrl], ['Add Google Search Console verification', !!DB.settings.analytics.googleVerification],
      ['Connect Google Analytics', !!DB.settings.analytics.gaId], ['Add a meeting booking link', !!DB.settings.bookingUrl],
      ['Add social profiles', Object.values(DB.settings.social).some(Boolean)], ['Publish at least 2 posts per month', DB.posts.length >= 3],
    ].map(function (c) { return h('li', { class: c[1] ? 'ok' : '' , text: c[0] }); }))]);
    v.appendChild(h('div', { class: 'grid2' }, [recent, quick]));
  };

  // Generic collection list (services, portfolio, posts)
  function listView(col, label, cols) {
    return function (v, id) {
      if (id) return editView(col, label, v, id);
      setTitle(label, [h('a', { class: 'btn btn-primary', href: '#/' + col + '/new', text: '+ Add new' })]);
      var q = h('input', { type: 'search', placeholder: 'Search…', class: 'search' });
      var tbl = h('div', { class: 'card table' });
      var draw = function () {
        tbl.innerHTML = '';
        var items = DB[col].filter(function (x) { return !q.value || JSON.stringify(x).toLowerCase().indexOf(q.value.toLowerCase()) > -1; });
        if (col === 'services' || col === 'industries') items = items.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        if (!items.length) tbl.appendChild(h('p', { class: 'muted pad', text: 'Nothing here yet.' }));
        items.forEach(function (x) {
          tbl.appendChild(h('a', { class: 'tr', href: '#/' + col + '/' + x.id }, [
            x.cover !== undefined ? h('span', { class: 'thumb' }, x.cover ? [h('img', { src: x.cover, alt: '' })] : []) : null,
            h('span', { class: 'tc grow' }, [h('strong', { text: x.title }), h('small', { class: 'muted', text: cols(x) })]),
            h('span', { class: 'st ' + (x.published ? 'st-won' : 'st-lost'), text: x.published ? 'Published' : 'Draft' }),
          ]));
        });
      };
      q.addEventListener('input', draw); draw();
      v.appendChild(h('div', { class: 'toolbar' }, [q])); v.appendChild(tbl);
    };
  }
  function editView(col, label, v, id) {
    var isNew = id === 'new';
    var item = isNew ? { published: true, publishedAt: new Date().toISOString().slice(0, 10), author: 'Reown Team', icon: 'spark', order: DB[col].length + 1, results: [], tags: [], features: [] } : DB[col].find(function (x) { return x.id === id; });
    if (!item) { v.appendChild(h('p', { text: 'Not found.' })); return; }
    var del = !isNew && h('button', { type: 'button', class: 'btn btn-danger', text: 'Delete', onclick: function () {
      if (!confirm('Delete “' + item.title + '”? This cannot be undone.')) return;
      api('DELETE', '/' + col + '/' + item.id).then(function () { DB[col] = DB[col].filter(function (x) { return x.id !== item.id; }); toast('Deleted'); location.hash = '#/' + col; });
    } });
    var viewBtn = !isNew && item.published && h('a', { class: 'btn btn-ghost', target: '_blank', href: { services: '/services/', industries: '/industries/', portfolio: '/portfolio/', posts: '/blog/' }[col] + item.slug, text: 'View live ↗' });
    setTitle((isNew ? 'New ' : 'Edit ') + ({ services: 'service', industries: 'industry', portfolio: 'project', posts: 'blog post' }[col] || label.toLowerCase()), [h('a', { class: 'btn btn-ghost', href: '#/' + col, text: '← Back' })].concat(viewBtn ? [viewBtn] : []));
    v.appendChild(form(S[col], item, function (out) {
      return (isNew ? api('POST', '/' + col, out) : api('PUT', '/' + col + '/' + item.id, out)).then(function (saved) {
        if (isNew) { DB[col].unshift(saved); location.hash = '#/' + col + '/' + saved.id; }
        else { Object.assign(item, saved); }
      });
    }, del ? [del] : []));
  }
  views.services = listView('services', 'Services', function (x) { return '/services/' + x.slug + ' · order ' + (x.order || 0); });
  views.portfolio = listView('portfolio', 'Portfolio', function (x) { return [x.client, x.category, x.year].filter(Boolean).join(' · ') + (x.featured ? ' · ★ Featured' : ''); });
  views.posts = listView('posts', 'Blog posts', function (x) { return [x.category, x.publishedAt].filter(Boolean).join(' · '); });
  views.industries = listView('industries', 'Industries', function (x) { return '/industries/' + x.slug + ' · order ' + (x.order || 0); });

  views.subscribers = function (v) {
    setTitle('Newsletter subscribers', [h('a', { class: 'btn btn-ghost', href: '/api/admin/export/subscribers.csv', text: 'Export CSV' })]);
    v.appendChild(h('p', { class: 'muted', text: 'People who joined your mailing list from the website. Export the CSV and import it into Mailchimp, Brevo or any email tool to send newsletters.' }));
    var q = h('input', { type: 'search', placeholder: 'Search email…', class: 'search' });
    var tbl = h('div', { class: 'card table' });
    var draw = function () {
      tbl.innerHTML = '';
      var items = DB.subscribers.filter(function (x) { return !q.value || x.email.indexOf(q.value.toLowerCase()) > -1; });
      if (!items.length) tbl.appendChild(h('p', { class: 'muted pad', text: 'No subscribers yet.' }));
      items.forEach(function (x) {
        tbl.appendChild(h('div', { class: 'tr' }, [
          h('span', { class: 'tc grow' }, [h('strong', { text: x.email }), h('small', { class: 'muted', text: 'Joined ' + fmt(x.createdAt) + (x.source ? ' · from ' + x.source : '') })]),
          h('button', { class: 'tb danger', text: 'Remove', onclick: function () {
            if (!confirm('Remove ' + x.email + ' from the list?')) return;
            api('DELETE', '/subscribers/' + x.id).then(function () { DB.subscribers = DB.subscribers.filter(function (y) { return y.id !== x.id; }); draw(); toast('Removed'); });
          } }),
        ]));
      });
    };
    q.addEventListener('input', draw); draw();
    v.appendChild(h('div', { class: 'toolbar' }, [q])); v.appendChild(tbl);
  };

  views.sections = function (v, key) {
    if (key && SECTIONS[key]) {
      setTitle('Section: ' + SECTIONS[key].l, [h('a', { class: 'btn btn-ghost', href: '#/sections', text: '← All sections' }), h('a', { class: 'btn btn-ghost', href: '/', target: '_blank', text: 'Preview ↗' })]);
      v.appendChild(form(SECTIONS[key].f, DB.sections[key], function (out) { return api('PUT', '/sections/' + key, out).then(function (r) { DB.sections[key] = r; }); }));
      return;
    }
    setTitle('Homepage sections');
    v.appendChild(h('p', { class: 'muted', text: 'Edit the text of each homepage section, reorder items, or hide a section entirely.' }));
    v.appendChild(h('div', { class: 'sec-grid' }, Object.keys(SECTIONS).map(function (k) {
      var on = DB.sections[k].enabled !== false;
      return h('a', { class: 'card sec-card', href: '#/sections/' + k }, [h('strong', { text: SECTIONS[k].l }), h('span', { class: 'st ' + (on ? 'st-won' : 'st-lost'), text: on ? 'Visible' : 'Hidden' })]);
    })));
  };

  views.settings = function (v) {
    setTitle('Settings & SEO');
    v.appendChild(form(S.settings, DB.settings, function (out) { return api('PUT', '/settings', out).then(function (r) { DB.settings = r; }); }));
    v.appendChild(h('div', { class: 'card' }, [h('h2', { text: 'Search engine files' }), h('p', { class: 'muted', text: 'These are generated automatically from your content:' }),
      h('ul', {}, [['/sitemap.xml', 'Submit this to Google Search Console & Bing Webmaster Tools'], ['/robots.txt', 'Crawler rules'], ['/rss.xml', 'Blog RSS feed']].map(function (x) {
        return h('li', {}, [h('a', { href: x[0], target: '_blank', text: x[0] }), ' — ' + x[1]]);
      }))]));
  };

  views.media = function (v) {
    var fileIn = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: function () {
      Promise.all(Array.prototype.map.call(fileIn.files, uploadFile)).then(function () { route(); });
    } });
    setTitle('Media library', [h('button', { class: 'btn btn-primary', text: 'Upload images', onclick: function () { fileIn.click(); } }), fileIn]);
    api('GET', '/media').then(function (files) {
      if (!files.length) return v.appendChild(h('p', { class: 'muted', text: 'No images uploaded yet.' }));
      v.appendChild(h('div', { class: 'media-grid' }, files.map(function (f) {
        return h('div', { class: 'media-item' }, [h('img', { src: f.url, alt: '', loading: 'lazy' }), h('div', { class: 'media-ctl' }, [
          h('button', { class: 'tb', text: 'Copy URL', onclick: function () { navigator.clipboard.writeText(f.url); toast('Copied ' + f.url); } }),
          h('button', { class: 'tb danger', text: 'Delete', onclick: function () { if (confirm('Delete this image? Pages using it will show a broken image.')) api('DELETE', '/media/' + encodeURIComponent(f.url.split('/').pop())).then(route); } }),
        ])]);
      })));
    });
  };

  var STATUSES = ['new', 'contacted', 'meeting', 'proposal', 'won', 'lost'];
  views.leads = function (v, id) {
    if (id) return leadView(v, id);
    setTitle('Leads & enquiries', [h('a', { class: 'btn btn-ghost', href: '/api/admin/export/leads.csv', text: 'Export CSV' })]);
    var q = h('input', { type: 'search', placeholder: 'Search name, email, idea…', class: 'search' });
    var sel = h('select', {}, [h('option', { value: '', text: 'All statuses' })].concat(STATUSES.map(function (s) { return h('option', { value: s, text: s }); })));
    var tbl = h('div', { class: 'card table' });
    var draw = function () {
      tbl.innerHTML = '';
      var items = DB.leads.filter(function (l) { return (!sel.value || l.status === sel.value) && (!q.value || JSON.stringify(l).toLowerCase().indexOf(q.value.toLowerCase()) > -1); });
      if (!items.length) tbl.appendChild(h('p', { class: 'muted pad', text: 'No enquiries found.' }));
      items.forEach(function (l) {
        tbl.appendChild(h('a', { class: 'tr', href: '#/leads/' + l.id }, [
          h('span', { class: 'st st-' + l.status, text: l.status }),
          h('span', { class: 'tc grow' }, [h('strong', { text: l.name + (l.company ? ' — ' + l.company : '') }), h('small', { class: 'muted', text: (l.services || []).join(', ') || l.projectType })]),
          h('span', { class: 'tc hide-sm' }, [h('small', { text: l.budget || '' }), h('small', { class: 'muted', text: fmt(l.createdAt) })]),
        ]));
      });
    };
    q.addEventListener('input', draw); sel.addEventListener('change', draw); draw();
    v.appendChild(h('div', { class: 'toolbar' }, [q, sel])); v.appendChild(tbl);
  };
  function leadView(v, id) {
    var l = DB.leads.find(function (x) { return x.id === id; });
    if (!l) return v.appendChild(h('p', { text: 'Not found.' }));
    setTitle(l.name, [h('a', { class: 'btn btn-ghost', href: '#/leads', text: '← All leads' }), h('a', { class: 'btn btn-primary', href: 'mailto:' + l.email + '?subject=' + encodeURIComponent('Re: Your project enquiry — Reown Ltd'), text: 'Reply by email' })]);
    var row = function (k, val) { return val ? h('div', { class: 'kv' }, [h('span', { text: k }), h('strong', { text: Array.isArray(val) ? val.join(', ') : val })]) : null; };
    var info = h('div', { class: 'card' }, [h('h2', { text: 'Project brief' }),
      row('Services', l.services), row('Stage', l.projectType), row('Budget', l.budget), row('Timeline', l.timeline),
      h('div', { class: 'idea' }, [h('span', { class: 'muted small', text: 'Idea / requirements' }), h('p', { text: l.idea })]),
      h('h2', { text: 'Contact' }), row('Email', l.email), row('Phone', l.phone), row('Organisation', l.company), row('Country', l.country),
      row('Preferred contact', l.contactPref), row('Meeting time', l.meetingTime), row('Submitted', fmt(l.createdAt)), row('Source page', l.source),
    ]);
    var status = h('select', {}, STATUSES.map(function (s) { var o = h('option', { value: s, text: s }); if (s === l.status) o.selected = true; return o; }));
    var notes = h('textarea', { rows: 8, placeholder: 'Follow-up notes, call outcomes, next steps…' }); notes.value = l.notes || '';
    var side = h('div', { class: 'card' }, [h('h2', { text: 'Follow-up' }), h('label', { class: 'f-label', text: 'Status' }), status, h('label', { class: 'f-label', text: 'Internal notes' }), notes,
      h('div', { class: 'form-actions' }, [
        h('button', { class: 'btn btn-primary', text: 'Save', onclick: function () {
          api('PUT', '/leads/' + l.id, Object.assign({}, l, { status: status.value, notes: notes.value })).then(function (r) { Object.assign(l, r); toast('Saved ✓'); updateBadge(); });
        } }),
        l.phone ? h('a', { class: 'btn btn-ghost', href: 'tel:' + l.phone.replace(/\s/g, ''), text: 'Call' }) : null,
        l.phone ? h('a', { class: 'btn btn-ghost', target: '_blank', href: 'https://wa.me/' + l.phone.replace(/\D/g, ''), text: 'WhatsApp' }) : null,
        h('button', { class: 'btn btn-danger', text: 'Delete', onclick: function () {
          if (!confirm('Delete this enquiry permanently?')) return;
          api('DELETE', '/leads/' + l.id).then(function () { DB.leads = DB.leads.filter(function (x) { return x.id !== l.id; }); updateBadge(); location.hash = '#/leads'; });
        } }),
      ])]);
    v.appendChild(h('div', { class: 'grid2 lead-grid' }, [info, side]));
  }

  // ---------- router ----------
  function updateBadge() { var n = DB.leads.filter(function (l) { return l.status === 'new'; }).length, b = $('#leadBadge'); b.textContent = n; b.hidden = !n; }
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/'), name = parts[0] || '', id = parts[1];
    var v = $('#view'); v.innerHTML = ''; v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
    $$('#nav a[data-route]').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-route') === name); });
    $('#side').classList.remove('open');
    (views[name] || views[''])(v, id);
    window.scrollTo(0, 0);
  }
  $('#sideToggle').addEventListener('click', function () { $('#side').classList.toggle('open'); });
  window.addEventListener('hashchange', route);
  api('GET', '/content').then(function (db) { DB = db; updateBadge(); route(); });
})();
