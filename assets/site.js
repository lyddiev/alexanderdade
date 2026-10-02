// Alexander Dade site behaviour: theme switch, markup switch, section tabs, change request form.
(function () {
  var root = document.documentElement;

  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Night switch: overrides the system setting and remembers the choice.
  var themeSwitch = document.querySelector('[data-switch="theme"]');
  if (themeSwitch) {
    var syncTheme = function () { themeSwitch.setAttribute('aria-checked', currentTheme() === 'dark' ? 'true' : 'false'); };
    syncTheme();
    themeSwitch.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store('theme', next);
      syncTheme();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', syncTheme);
    }
  }

  // Show markup switch: reveals the tracked changes on the cover.
  var markupSwitch = document.querySelector('[data-switch="markup"]');
  if (markupSwitch) {
    markupSwitch.addEventListener('click', function () {
      var on = markupSwitch.getAttribute('aria-checked') !== 'true';
      markupSwitch.setAttribute('aria-checked', on ? 'true' : 'false');
      root.classList.toggle('show-markup', on);
    });
  }

  // Arrive at the top unless a link asked for a section; keep the address bar clean
  // so a reload never lands halfway down the page.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cleanUrl = function () { if (location.hash) history.replaceState(null, '', location.pathname + location.search); };
  window.addEventListener('load', function () {
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
    cleanUrl();
  });
  var go = function (el, block) { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: block || 'start' }); };

  // Same-page links (tabs, back to top) scroll without writing #section into the URL.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || a.hasAttribute('data-rev')) return;
    var url = new URL(a.href, location.href);
    if (url.pathname.replace(/index\.html$/, '') !== location.pathname.replace(/index\.html$/, '')) return;
    var id = url.hash.slice(1);
    if (id === 'top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
    var el = id && document.getElementById(id);
    if (el) { e.preventDefault(); go(el); }
  });

  // Fig. 1: one deliberate control. The + beside the caption (or a click on the drawing)
  // opens the components view; it stays open until closed with x, a second click, or Esc.
  var fig = document.querySelector('.cover-fig');
  var cue = fig && fig.querySelector('.fig-cue');
  var stage = fig && fig.querySelector('.fig-stage');
  if (fig && cue) {
    var setOpen = function (on) {
      fig.classList.toggle('is-open', on);
      if (on) fig.classList.add('was-opened');
      cue.setAttribute('aria-expanded', on ? 'true' : 'false');
      var label = on ? 'Hide components' : 'Show major components';
      cue.setAttribute('aria-label', label);
      cue.setAttribute('title', label);
      if (!on) fig.removeAttribute('data-hl');
    };
    var toggle = function () { setOpen(!fig.classList.contains('is-open')); };
    cue.addEventListener('click', toggle);
    if (stage) stage.addEventListener('click', toggle);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && fig.classList.contains('is-open')) { setOpen(false); cue.focus(); }
    });
    fig.querySelectorAll('.parts [data-part]').forEach(function (row) {
      row.addEventListener('pointerenter', function () { fig.setAttribute('data-hl', row.getAttribute('data-part')); });
      row.addEventListener('pointerleave', function () { fig.removeAttribute('data-hl'); });
    });
  }

  // Back-to-top tab shows once the cover is out of view.
  var tabsNav = document.querySelector('.tabs');
  if (tabsNav) {
    var topTick = false;
    var showTop = function () { topTick = false; tabsNav.classList.toggle('show-top', window.scrollY > window.innerHeight * 0.8); };
    window.addEventListener('scroll', function () { if (!topTick) { topTick = true; requestAnimationFrame(showTop); } }, { passive: true });
    showTop();
  }

  // Tabs: pull out the tab for whichever section is on screen (home page only).
  var tabs = document.querySelectorAll('.tabs .tab');
  var sections = ['overview', 'samples', 'record', 'specs', 'troubleshooting'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (tabs.length && sections.length) {
    var byId = {};
    tabs.forEach(function (t) { byId[t.getAttribute('href').split('#')[1]] = t; });
    var ticking = false;
    var spy = function () {
      ticking = false;
      var line = window.innerHeight * 0.25, current = null;
      sections.forEach(function (el) { if (el.getBoundingClientRect().top <= line) current = el.id; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1].id;
      tabs.forEach(function (t) { t.removeAttribute('aria-current'); });
      if (current && byId[current]) byId[current].setAttribute('aria-current', 'true');
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  }

  // Change request form: live CR number, status track, character count,
  // submits to Netlify Forms without leaving the page and stamps it received.
  var form = document.querySelector('form.cr');
  if (form) {
    var status = form.querySelector('.cr-status');
    var button = form.querySelector('button[type="submit"]');
    var numberEl = form.querySelector('.cr-number');
    var numberInput = form.querySelector('input[name="cr-number"]');
    var details = form.querySelector('textarea[name="details"]');
    var count = form.querySelector('.cr-count');

    var d = new Date();
    var crNo = 'CR-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(1000 + Math.random() * 9000));
    if (numberEl) numberEl.textContent = crNo;
    if (numberInput) numberInput.value = crNo;

    var state = form.querySelector('.cr-state');
    function setStep(name) { if (state && name === 'submitted') state.textContent = 'Received'; }

    if (details && count) {
      details.addEventListener('input', function () { count.textContent = details.value.length + ' / 1500'; });
    }

    if (window.fetch) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        button.disabled = true;
        status.textContent = 'Submitting\u2026';
        var body = new URLSearchParams(new FormData(form)).toString();
        fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
          .then(function (r) {
            if (!r.ok) throw new Error(r.status);
            setStep('submitted');
            form.classList.add('cr-sent');
            var t = new Date();
            status.textContent = crNo + ' received ' + t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' at ' + t.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) + '. I\u2019ll reply to the address you gave.';
            Array.prototype.forEach.call(form.elements, function (el) { if (el.type !== 'hidden') el.disabled = true; });
          })
          .catch(function () {
            button.disabled = false;
            status.innerHTML = 'That didn\u2019t send. Email me instead at <a href="mailto:connectwithalexander@icloud.com">connectwithalexander@icloud.com</a>.';
          });
      });
    }
  }
})();
