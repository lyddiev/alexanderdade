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
  var markup = document.querySelector('.markup');
  if (markupSwitch && markup) {
    markupSwitch.addEventListener('click', function () {
      var on = markupSwitch.getAttribute('aria-checked') !== 'true';
      markupSwitch.setAttribute('aria-checked', on ? 'true' : 'false');
      root.classList.toggle('show-markup', on);
      markup.setAttribute('aria-hidden', on ? 'false' : 'true');
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

  // Fig. 1: hover (or tap) takes the operator apart. Each part is listed with the
  // revisions it was installed in, and those link down into the history.
  var fig = document.querySelector('.cover-fig');
  var stage = fig && fig.querySelector('.fig-stage');
  var setOpen = function () {};
  if (stage) {
    var pinned = false;
    setOpen = function (on) {
      fig.classList.toggle('is-open', on);
      stage.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    fig.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') setOpen(true); });
    fig.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !pinned) setOpen(false); fig.removeAttribute('data-hl'); });
    stage.addEventListener('click', function (e) {
      pinned = !pinned;
      var mouse = e.pointerType === 'mouse' || (e.detail > 0 && window.matchMedia('(hover: hover)').matches);
      setOpen(pinned || mouse);
    });
    fig.querySelectorAll('.parts tr[data-part]').forEach(function (tr) {
      tr.addEventListener('pointerenter', function () { fig.setAttribute('data-hl', tr.getAttribute('data-part')); });
      tr.addEventListener('pointerleave', function () { fig.removeAttribute('data-hl'); });
    });
    var flag = function (li) {
      li.classList.add('is-flagged');
      setTimeout(function () { li.classList.remove('is-flagged'); }, 1600);
    };
    fig.querySelectorAll('a[data-rev]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var li = document.getElementById('rev-' + a.getAttribute('data-rev'));
        if (!li) return;
        e.preventDefault();
        go(li, 'center');
        flag(li);
      });
    });
    // History badges point back up at the part in the drawing.
    document.querySelectorAll('.part-ref').forEach(function (b) {
      b.addEventListener('click', function () {
        pinned = true;
        setOpen(true);
        fig.setAttribute('data-hl', b.getAttribute('data-part'));
        go(fig, 'center');
        setTimeout(function () { fig.removeAttribute('data-hl'); }, 2600);
      });
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
  var sections = ['about', 'samples', 'record', 'contact'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (tabs.length && sections.length) {
    var byId = {};
    tabs.forEach(function (t) { byId[t.getAttribute('href').split('#')[1]] = t; });
    var ticking = false;
    var spy = function () {
      ticking = false;
      var line = window.innerHeight * 0.4, current = null;
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
    var steps = {};
    form.querySelectorAll('.cr-track li').forEach(function (li) { steps[li.getAttribute('data-step')] = li; });

    var d = new Date();
    var crNo = 'CR-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(1000 + Math.random() * 9000));
    if (numberEl) numberEl.textContent = crNo;
    if (numberInput) numberInput.value = crNo;

    function setStep(name) {
      var order = ['draft', 'submitted', 'reply'], reached = true;
      order.forEach(function (k) {
        if (!steps[k]) return;
        steps[k].classList.toggle('is-on', reached);
        steps[k].classList.toggle('is-current', k === name);
        if (k === name) reached = false;
      });
    }
    setStep('draft');

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
