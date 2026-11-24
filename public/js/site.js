/* Reown Ltd — site interactions */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Theme toggle ---- */
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  $('#themeToggle') && $('#themeToggle').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('reown-theme', next); } catch (e) {}
  });
  mq.addEventListener && mq.addEventListener('change', function (e) {
    var saved = null; try { saved = localStorage.getItem('reown-theme'); } catch (_) {}
    if (!saved) root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  });

  /* ---- Header: scrolled state, progress bar, FAB visibility ---- */
  var header = $('.site-header'), bar = $('#progress'), fab = $('.fab-wrap');
  function onScroll() {
    var y = window.scrollY, h = d.body.scrollHeight - window.innerHeight;
    header && header.classList.toggle('scrolled', y > 10);
    if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    fab && fab.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- Mobile menu ---- */
  var burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    if (!burger) return;
    burger.setAttribute('aria-expanded', open); menu.classList.toggle('open', open);
    d.body.style.overflow = open ? 'hidden' : '';
  }
  burger && burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  menu && menu.addEventListener('click', function (e) { if (e.target.closest('a[href]') && !e.target.closest('.has-drop > a')) setMenu(false); });
  $$('.has-drop > a').forEach(function (a) {
    a.addEventListener('click', function (e) { if (window.innerWidth < 1024) { e.preventDefault(); a.nextElementSibling.classList.toggle('open'); } });
  });

  /* ---- Hero rotating words (typewriter) ---- */
  var rot = $('.rotator');
  if (rot && !reduce) {
    var words = []; try { words = JSON.parse(rot.getAttribute('data-words')); } catch (e) {}
    var el = $('.rot-word', rot), wi = 0, ci = words[0] ? words[0].length : 0, del = true;
    if (words.length > 1) setTimeout(function tick() {
      var w = words[wi];
      if (del) { ci--; if (ci <= 0) { del = false; wi = (wi + 1) % words.length; } }
      else { ci++; if (ci >= words[wi].length) { del = true; el.textContent = words[wi]; return setTimeout(tick, 2200); } }
      el.textContent = words[wi].slice(0, Math.max(0, ci)) || '​';
      setTimeout(tick, del ? 35 : 70);
    }, 2600);
  }

  /* ---- Scroll reveal ---- */
  var revealEls = $$('.reveal, .reveal-left, .reveal-right');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (e) { io.observe(e); });
  } else revealEls.forEach(function (e) { e.classList.add('in'); });

  /* ---- Counters ---- */
  var counters = $$('.count');
  function count(el) {
    var to = parseFloat(el.getAttribute('data-to')) || 0, t0 = null, dur = 1600;
    if (reduce) { el.textContent = to; return; }
    requestAnimationFrame(function step(t) {
      if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(step);
    });
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { count(x.target); cio.unobserve(x.target); } }); }, { threshold: .5 });
    counters.forEach(function (c) { cio.observe(c); });
  } else counters.forEach(count);

  /* ---- Card spotlight + subtle tilt ---- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.tilt').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
        c.style.transform = 'translateY(-6px) perspective(800px) rotateX(' + ((.5 - y) * 5) + 'deg) rotateY(' + ((x - .5) * 5) + 'deg)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
    var hv = $('.hero-visual');
    hv && window.addEventListener('pointermove', function (e) {
      var x = e.clientX / window.innerWidth - .5, y = e.clientY / window.innerHeight - .5;
      hv.style.transform = 'translate(' + x * -18 + 'px,' + y * -18 + 'px)';
    }, { passive: true });
  }

  /* ---- Portfolio filter ---- */
  $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-filter]').forEach(function (x) { x.classList.toggle('active', x === b); });
      var f = b.getAttribute('data-filter');
      $$('#pfGrid .pf-card').forEach(function (c) {
        var show = f === '*' || c.getAttribute('data-cat') === f;
        c.classList.toggle('hide', !show);
        if (show) { c.classList.remove('in'); void c.offsetWidth; c.classList.add('in'); }
      });
    });
  });

  /* ---- Newsletter forms ---- */
  $$('.nl-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('.nl-msg', f), btn = $('button', f), email = $('input[type=email]', f);
      var show = function (html, bad) { msg.innerHTML = html; msg.classList.toggle('bad', !!bad); msg.hidden = false; };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return show('Please enter a valid email address.', true);
      btn.disabled = true;
      fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.value, website: $('.hp', f).value, source: location.pathname }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) throw new Error(j.error);
          email.value = '';
          var a = j.leadMagnetUrl ? ' <a href="' + encodeURI(j.leadMagnetUrl) + '">Get your free ' + (j.leadMagnetTitle || 'resource').replace(/</g, '&lt;') + ' →</a>' : '';
          show('🎉 You’re subscribed!' + a);
          if (window.gtag) gtag('event', 'sign_up', { method: 'newsletter' });
        })
        .catch(function (err) { show(err.message || 'Something went wrong.', true); })
        .finally(function () { btn.disabled = false; });
    });
  });

  /* ---- Contact modal (multi-step project brief) ---- */
  var modal = $('#contactModal'), form = $('#briefForm');
  if (!modal || !form) return;
  var steps = $$('.step', form), stepIdx = 0, lastFocus = null;
  var btnPrev = $('[data-prev]', form), btnNext = $('[data-next]', form), btnSubmit = $('[data-submit]', form);
  var errBox = $('.form-error', form), bars = $$('.steps-bar span', form);

  function showStep(i) {
    stepIdx = i;
    steps.forEach(function (s, k) { s.classList.toggle('active', k === i); });
    bars.forEach(function (b, k) { b.classList.toggle('on', k <= i); });
    btnPrev.hidden = i === 0; btnNext.hidden = i === steps.length - 1; btnSubmit.hidden = i !== steps.length - 1;
    errBox.hidden = true;
    var f = $('input:not([type=hidden]):not(.hp), textarea', steps[i]);
    if (f && window.innerWidth > 900) setTimeout(function () { f.focus({ preventScroll: true }); }, 50);
  }
  function openModal(service) {
    lastFocus = d.activeElement;
    modal.hidden = false; modal.classList.remove('closing'); d.body.classList.add('modal-open');
    if (service) $$('input[name=services]', form).forEach(function (c) { if (c.value === service) c.checked = true; });
    setTimeout(function () { $('.modal-close', modal).focus(); }, 60);
    if (window.gtag) gtag('event', 'open_contact_form');
  }
  function closeModal() {
    modal.classList.add('closing');
    setTimeout(function () {
      modal.hidden = true; modal.classList.remove('closing'); d.body.classList.remove('modal-open'); lastFocus && lastFocus.focus();
      if (!$('.step-done', form).hidden) { // reset after a successful submission
        form.reset(); $('.step-done', form).hidden = true; $('.step-nav', form).hidden = false; $('.steps-bar', form).hidden = false; showStep(0);
      }
    }, 280);
  }
  d.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open-contact]');
    if (t) { e.preventDefault(); setMenu(false); openModal(t.getAttribute('data-service')); }
    if (e.target.closest('[data-close]')) closeModal();
  });
  d.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') { // focus trap
      var f = $$('button:not([hidden]), [href], input:not(.hp), select, textarea', modal).filter(function (x) { return x.offsetParent !== null; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // Open automatically from links like /#contact
  if (location.hash === '#contact') openModal();

  function validStep(i) {
    var ok = true, msg = '';
    $$('[required]', steps[i]).forEach(function (f) {
      var bad = f.type === 'checkbox' ? !f.checked : !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value)) || (f.minLength > 0 && f.value.trim().length < f.minLength);
      f.classList.toggle('invalid', bad); if (bad) ok = false;
    });
    if (i === 0 && !$$('input[name=services]:checked', form).length) { ok = false; msg = 'Please select at least one service (or choose “Not sure yet”).'; if ($('input[name=projectType]:checked', form).value === 'Not sure yet') { ok = true; msg = ''; } }
    if (!ok) { errBox.textContent = msg || 'Please complete the highlighted fields.'; errBox.hidden = false; }
    return ok;
  }
  btnNext.addEventListener('click', function () { if (validStep(stepIdx)) showStep(stepIdx + 1); });
  btnPrev.addEventListener('click', function () { showStep(stepIdx - 1); });
  form.addEventListener('input', function (e) { e.target.classList.remove('invalid'); });
  form.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && stepIdx < steps.length - 1) { e.preventDefault(); btnNext.click(); } });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validStep(stepIdx)) return;
    var fd = new FormData(form), data = {};
    fd.forEach(function (v, k) { if (k === 'services') (data.services = data.services || []).push(v); else data[k] = v; });
    data.source = location.pathname + (document.referrer ? ' (ref: ' + document.referrer + ')' : '');
    btnSubmit.disabled = true; btnSubmit.textContent = 'Sending…';
    fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.ok) throw new Error(res.j.error || 'Something went wrong.');
        steps.forEach(function (s) { s.classList.remove('active'); });
        $('.step-nav', form).hidden = true; $('.steps-bar', form).hidden = true;
        $('.step-done', form).hidden = false;
        if (res.j.bookingUrl) { var b = $('#bookAfter'); b.href = res.j.bookingUrl; b.hidden = false; }
        if (window.gtag) gtag('event', 'generate_lead');
      })
      .catch(function (err) { errBox.textContent = err.message; errBox.hidden = false; })
      .finally(function () { btnSubmit.disabled = false; btnSubmit.textContent = 'Send my project brief'; });
  });
})();
