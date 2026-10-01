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

  // Tabs: pull out the tab for whichever section is on screen (home page only).
  var tabs = document.querySelectorAll('.tabs .tab');
  var sections = ['samples', 'record', 'contact'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (tabs.length && sections.length && 'IntersectionObserver' in window) {
    var byId = {};
    tabs.forEach(function (t) { byId[t.getAttribute('href').split('#')[1]] = t; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tabs.forEach(function (t) { t.removeAttribute('aria-current'); });
        if (byId[e.target.id]) byId[e.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (el) { io.observe(el); });
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
