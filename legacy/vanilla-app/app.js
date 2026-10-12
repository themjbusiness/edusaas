(function () {
  'use strict';

  var TOKEN_KEY = 'edusaas_token';
  var app = document.getElementById('app');

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function each(sel, fn) { Array.prototype.forEach.call(app.querySelectorAll(sel), fn); }
  function initials(n) { return n.replace(/^(Mr|Mrs|Ms|Dr)\.\s*/, '').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2); }
  function mmss(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2); }
  /* ---------- language (F23) ---------- */
  var LANG = 'en';
  try { LANG = localStorage.getItem('edusaas_lang') === 'ur' ? 'ur' : 'en'; } catch (e) {}
  function LOC() { return LANG === 'ur' ? 'ur-PK' : []; }
  // T('Hello {name}', {name: x}): the sentence in the current language. Vars are inserted as given (escape them first).
  function T(key, vars) {
    var str = (LANG === 'ur' && window.EDU_UR && window.EDU_UR[key]) || key;
    return vars ? str.replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; }) : str;
  }
  function subj(name) { return (LANG === 'ur' && window.EDU_UR_SUBJECTS && window.EDU_UR_SUBJECTS[name]) || name; }
  function errMsg(e) { return (LANG === 'ur' && window.EDU_UR_ERRORS && window.EDU_UR_ERRORS[e.code]) || e.message || ''; }
  function loadUrduFont() {  // only fetched when Urdu is on screen, to save data
    if (document.getElementById('ur-font')) return;
    var l = document.createElement('link'); l.id = 'ur-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap';
    document.head.appendChild(l);
  }
  function applyLang() {
    var r = document.documentElement;
    r.lang = LANG === 'ur' ? 'ur' : 'en';
    r.dir = LANG === 'ur' ? 'rtl' : 'ltr';
    if (LANG === 'ur') loadUrduFont();
    var b = document.getElementById('t-lang');
    if (b) { b.textContent = LANG === 'ur' ? 'English' : 'اردو'; b.setAttribute('aria-label', LANG === 'ur' ? 'Switch to English' : T('Switch to Urdu')); }
  }
  function setLang(l, save) {
    LANG = l === 'ur' ? 'ur' : 'en';
    try { localStorage.setItem('edusaas_lang', LANG); } catch (e) {}
    applyLang();
    if (save && token) post('me/language', { language: LANG }).then(function () { if (ME) ME.language = LANG; }, function () {});
  }
  function hm(iso) { return iso ? new Date(iso).toLocaleTimeString(LOC(), { hour: '2-digit', minute: '2-digit' }) : ''; }
  function dayName(iso) { return new Date(iso + 'T00:00:00').toLocaleDateString(LOC(), { weekday: 'short', day: 'numeric', month: 'short' }); }
  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso), today = new Date();
    return (d.toDateString() === today.toDateString() ? (LANG === 'ur' ? 'آج' : 'today') : d.toLocaleDateString(LOC(), { day: 'numeric', month: 'short' })) + ' ' + hm(iso);
  }
  function todayLong() { return new Date().toLocaleDateString(LOC(), { weekday: 'long', day: 'numeric', month: 'long' }); }
  function prettyPhone(p) { return p ? p.replace(/^\+92(\d{3})(\d{7})$/, '+92 $1 $2') : ''; }

  var ICONS = {
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M10 8l4 2.5L10 13z"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    library: '<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="M16 5l3.5-1 3 15.5-3.5 1z"/>',
    chat: '<path d="M4 20l1.5-4A8 8 0 1 1 8 18.5z"/>',
    logout: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6 6 0 0 1 3.5 6"/>',
    wifiOff: '<path d="M2 2l20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.5a10 10 0 0 1 4-2.4"/><path d="M14.5 10.1a10 10 0 0 1 4.5 2.4"/><path d="M2 8.8a15 15 0 0 1 4.3-2.8"/><path d="M10.7 5A15 15 0 0 1 22 8.8"/><circle cx="12" cy="20" r=".5"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
    pause: '<path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor"/>',
    prev: '<path d="M18 5l-9 7 9 7z"/><path d="M6 5v14"/>',
    next: '<path d="M6 5l9 7-9 7z"/><path d="M18 5v14"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    cross: '<path d="M6 6l12 12M18 6L6 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4"/><path d="M12 17.5v.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    zoom: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M11 8v6M8 11h6"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    pages: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    refresh: '<path d="M4 4v6h6"/><path d="M20 20v-6h-6"/><path d="M5.5 15a7.5 7.5 0 0 0 13 1.5M18.5 9a7.5 7.5 0 0 0-13-1.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    sms: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M7 10h10M7 13h6"/>',
    atom: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
    leaf: '<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/><path d="M5 19l8-8"/>',
    sigma: '<path d="M18 5H6l6 7-6 7h12"/>',
    text: '<path d="M4 6h16M4 10h16M4 14h10M4 18h13"/>',
    code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    plus2: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'
  };
  var SUBJECT_ICONS = { phy: 'atom', chem: 'flask', bio: 'leaf', math: 'sigma', eng: 'text', cs: 'code' };
  function subjectIcon(code, cls) { return icon(SUBJECT_ICONS[String(code || '').replace(/\d+$/, '')] || 'book', cls); }
  function icon(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[n] + '</svg>'; }
  function ring(pct, label) {
    var r = 28, c = 2 * Math.PI * r;
    return '<svg class="ring" viewBox="0 0 64 64" role="img" aria-label="' + esc(label) + '"><circle class="t" cx="32" cy="32" r="' + r + '"/>' +
      '<circle class="v" cx="32" cy="32" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - pct)) + '"/>' +
      '<text x="32" y="32">' + Math.round(pct * 100) + '%</text></svg>';
  }
  var toastT;
  function toast(msg) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3500);
  }
  // In-app dialog (bottom sheet on phones, centred on wide screens); replaces window.prompt.
  // opts: title, body (HTML), confirm (label), onConfirm(sheetEl) returning a promise; reject with a message to keep it open.
  function sheet(opts) {
    closeSheet();
    var back = document.createElement('div'), prevFocus = document.activeElement;
    back.className = 'sheet-back';
    back.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t"><div class="grab" aria-hidden="true"></div>' +
      '<h2 id="sh-t">' + esc(opts.title) + '</h2><div class="sheet-body">' + opts.body + '</div><p class="small err" id="sh-err" role="alert"></p>' +
      '<div class="row"><button id="sh-no" class="grow">Cancel</button><button id="sh-ok" class="primary grow">' + esc(opts.confirm || 'Save') + '</button></div></div>';
    document.body.appendChild(back);
    document.body.classList.add('sheet-open');
    var el = back.querySelector('.sheet'), ok = $('sh-ok');
    function close() { closeSheet(); if (prevFocus && prevFocus.focus) prevFocus.focus(); }
    back.onclick = function (e) { if (e.target === back) close(); };
    $('sh-no').onclick = close;
    back.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // keep focus inside the dialog
        var f = el.querySelectorAll('button, input, textarea, select'), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    ok.onclick = function () {
      ok.disabled = true; $('sh-err').textContent = '';
      Promise.resolve(opts.onConfirm(el)).then(close, function (e) { ok.disabled = false; $('sh-err').textContent = e && e.message ? e.message : String(e); });
    };
    var f0 = el.querySelector('input, textarea, select') || ok; f0.focus();
    if (opts.onOpen) opts.onOpen(el);
    return el;
  }
  function closeSheet() {
    var s = document.querySelector('.sheet-back'); if (s) s.remove();
    document.body.classList.remove('sheet-open');
  }
  function skeleton(n) {
    var h = '';
    for (var i = 0; i < (n || 3); i++) h += '<div class="card"><div class="skeleton-row"><i style="width:55%"></i><i></i><i style="width:35%"></i></div></div>';
    return h;
  }
  function errorCard(e, retry) {
    var off = navigator.onLine === false;
    return '<div class="card" style="text-align:center;padding:24px 16px">' + icon(off ? 'wifiOff' : 'alert') +
      '<p><b>' + T(off ? 'You are offline' : 'Could not load this page') + '</b><br><span class="muted">' + esc(errMsg(e)) + '</span></p>' +
      (retry ? '<button class="primary" id="retry">' + T('Try again') + '</button>' : '') + '</div>';
  }

  /* ---------- API ---------- */
  var token = null, ME = null;
  try { token = localStorage.getItem(TOKEN_KEY); } catch (e) {}
  function setToken(t) { token = t; try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (e) {} }
  function call(method, path, body, opts) {
    var headers = { 'Accept': 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch('/api/' + path, { method: method, headers: headers, body: body !== undefined ? JSON.stringify(body) : undefined,
      keepalive: !!(opts && opts.keepalive) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (r.ok) return data;
          var err = new Error(data.message || 'Request failed (' + r.status + ')');
          err.status = r.status; err.code = data.error;
          if (r.status === 401 && token) { setToken(null); ME = null; location.hash = '#/login'; }
          throw err;
        });
      }, function () {
        var err = new Error(navigator.onLine === false ? 'Check your internet connection.' : 'Cannot reach the server.');
        err.status = 0; throw err;
      });
  }
  function get(p) { return call('GET', p); }
  function post(p, b, o) { return call('POST', p, b === undefined ? {} : b, o); }

  /* ---------- web push (F3) ---------- */
  var swReady = null;
  if ('serviceWorker' in navigator && window.isSecureContext) {
    swReady = navigator.serviceWorker.register('/sw.js').then(function () { return navigator.serviceWorker.ready; }, function () { return null; });
  }
  function pushSupport() {
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
    if (!window.isSecureContext) return 'insecure';
    if (!swReady || !('PushManager' in window) || !('Notification' in window)) return ios && !standalone ? 'ios' : 'none';
    if (Notification.permission === 'denied') return 'denied';
    return 'ok';
  }
  function keyBytes(b64) {
    var s = b64.replace(/-/g, '+').replace(/_/g, '/'); s += '==='.slice((s.length + 3) % 4);
    var raw = atob(s), out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function currentSub() {
    return swReady.then(function (r) { return r ? r.pushManager.getSubscription() : null; });
  }
  function enablePush() {
    return Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') throw new Error('Notifications were not allowed on this phone.');
      return Promise.all([get('push/key'), swReady]);
    }).then(function (res) {
      return res[1].pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(res[0].publicKey) });
    }).then(function (sub) { return post('push/subscribe', sub.toJSON()); });
  }
  function disablePush() {
    return currentSub().then(function (sub) {
      if (!sub) return null;
      var ep = sub.endpoint;
      return sub.unsubscribe().then(function () { return post('push/unsubscribe', { endpoint: ep }); });
    });
  }
  function alertsCard() { return '<div class="card alerts-card" id="alerts-card" aria-live="polite"></div>'; }
  function fillAlertsCard() {
    var el = $('alerts-card'); if (!el) return;
    var teacher = ME && ME.role === 'teacher';
    function draw(state) {
      var msg = {
        insecure: T('Alerts on this phone need the app’s secure (https) address. They will work once EduSaas is hosted; until then every alert is in Messages.'),
        ios: T('On iPhone: tap Share, then <b>Add to Home Screen</b>. Open EduSaas from the Home Screen to turn on alerts.'),
        none: T('This browser can’t show alerts. Open EduSaas in Chrome to get them.'),
        denied: T('Notifications are blocked for this site. Allow them in the browser’s site settings, then come back.'),
        off: T(teacher ? 'Get a notification when a student you teach is cleared. Free, and every alert is also kept in Messages.'
          : 'Get a notification when your child is absent or cleared. Free, and every alert is also kept in Messages.'),
        on: T('Alerts are on for this phone.')
      }[state];
      el.innerHTML = '<div class="row">' + icon(state === 'on' ? 'check' : 'alert') + '<div class="grow"><b>' + T('Alerts on this phone') + '</b><div class="muted small">' + msg + '</div></div>' +
        (state === 'off' ? '<button class="primary sm" id="push-on">' + T('Turn on') + '</button>' : state === 'on' ? '<button class="ghost sm" id="push-off">' + T('Turn off') + '</button>' : '') + '</div>';
      el.className = 'card alerts-card' + (state === 'on' ? ' on' : '');
      if ($('push-on')) $('push-on').onclick = function () {
        this.disabled = true; this.textContent = T('Turning on…');
        enablePush().then(function () { toast(T('Alerts are on for this phone')); draw('on'); },
          function (e) { toast(T(e.message || 'Could not turn on alerts')); draw(pushSupport() === 'denied' ? 'denied' : 'off'); });
      };
      if ($('push-off')) $('push-off').onclick = function () {
        disablePush().then(function () { toast(T('Alerts turned off for this phone')); draw('off'); }, function (e) { toast(e.message); });
      };
    }
    var st = pushSupport();
    if (st !== 'ok') { draw(st); return; }
    currentSub().then(function (sub) { draw(sub ? 'on' : 'off'); }, function () { draw('off'); });
  }

  /* ---------- header ---------- */
  document.querySelector('.brand .mark').innerHTML = icon('book');
  $('t-theme').innerHTML = icon('moon');
  $('t-lang').onclick = function () { setLang(LANG === 'ur' ? 'en' : 'ur', true); route(); };
  applyLang();
  $('t-theme').onclick = function () {
    var r = document.documentElement, cur = r.getAttribute('data-theme');
    var dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    r.setAttribute('data-theme', dark ? 'light' : 'dark');
    try { localStorage.setItem('edusaas_theme', dark ? 'light' : 'dark'); } catch (e) {}
  };
  try { var th = localStorage.getItem('edusaas_theme'); if (th) document.documentElement.setAttribute('data-theme', th); } catch (e) {}

  /* ---------- routing ---------- */
  var HOME = { student: '#/home', teacher: '#/teacher', parent: '#/parent', college_admin: '#/admin' };
  var NAV = {
    student: [['home', 'home', 'Home'], ['library', 'library', 'Library']],
    teacher: [['teacher', 'users', 'My classes'], ['msgs', 'chat', 'Alerts log']],
    parent: [['parent', 'home', 'My child'], ['msgs', 'chat', 'Messages']],
    college_admin: [['admin', 'home', 'Home'], ['people', 'users', 'People'], ['classes', 'library', 'Classes'], ['import', 'pages', 'Import']]
  };
  var ACCESS = { home: 'student', library: 'student', subject: 'student', lesson: 'student', quiz: 'student',
    teacher: 'teacher', class: 'teacher', parent: 'parent', child: 'parent', msgs: 'teacher parent',
    admin: 'college_admin', activity: 'college_admin', people: 'college_admin', classes: 'college_admin', import: 'college_admin' };
  function nav(name) {
    var n = $('nav');
    if (!ME) { n.innerHTML = ''; n.hidden = true; return; }
    n.hidden = false;
    var active = { lesson: 'home', quiz: 'home', subject: 'home', class: 'teacher', child: 'parent', activity: 'admin' }[name] || name;
    n.innerHTML = NAV[ME.role].map(function (i) {
      return '<a href="#/' + i[0] + '"' + (active === i[0] ? ' aria-current="page"' : '') + '>' + icon(i[1]) + T(i[2]) + '</a>';
    }).join('') + '<a href="#/logout">' + icon('logout') + T('Log out') + '</a>';
  }
  function banner() {
    return navigator.onLine === false ? '<div class="banner off" role="status">' + icon('wifiOff', 'sm') +
      '<span>' + T('You are offline. Reconnect to continue; your progress so far is saved.') + '</span></div>' : '';
  }
  var routes = {}, leaveHooks = [];
  function route() {
    var parts = (location.hash || '#/').split('/');
    var name = parts[1] || '', arg = parts[2], arg2 = parts[3];
    leaveHooks.splice(0).forEach(function (f) { try { f(); } catch (e) {} });
    closeZoom(); closeSheet();
    var cf = document.querySelector('.confetti'); if (cf) cf.remove();
    document.body.classList.toggle('has-player', name === 'lesson');
    if (name === 'logout') { logout(); return; }
    if (!token) {
      if (name !== 'login') { location.hash = '#/login'; return; }
    } else if (!ME) {
      app.innerHTML = skeleton(2);
      get('me').then(function (m) { ME = m; if (m.language && m.language !== LANG) setLang(m.language, false); route(); },
        function (e) { if (e.status !== 401) app.innerHTML = errorCard(e); });
      return;
    }
    if (ME && (name === 'login' || !routes[name] || ACCESS[name].indexOf(ME.role) < 0)) { location.hash = HOME[ME.role]; return; }
    routes[name](arg, arg2);
    nav(name);
    window.scrollTo(0, 0);
  }
  function logout() {
    var finished = false;
    function done() {
      if (finished) return; finished = true;
      setToken(null); ME = null;
      var t = document.querySelector('.toast'); if (t) t.hidden = true;
      location.hash = '#/login';
    }
    // This phone should stop getting the previous person's alerts.
    if (token && pushSupport() === 'ok') { disablePush().then(done, done); setTimeout(done, 2000); } else done();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('online', function () { toast('Back online'); });
  window.addEventListener('offline', function () { toast('You are offline'); });

  /* ---------- login ---------- */
  routes.login = function () {
    var step = 'phone', phone = '', timer = null;
    function draw() {
      app.innerHTML =
        '<div style="text-align:center;margin:18px 0 20px"><span class="mark big">' + icon('book') + '</span>' +
        '<h1 style="margin-top:12px">' + T('Sign in') + '</h1><p class="muted">' + T('For students, teachers and parents registered by your college.') + '</p></div>' +
        '<div class="card">' +
        (step === 'phone'
          ? '<label class="field" for="ph">' + T('Mobile number') + '</label><div class="phone"><span>+92</span><input id="ph" type="tel" inputmode="numeric" maxlength="11" placeholder="3001234567" autocomplete="tel-national"></div>' +
            '<p class="small err" id="perr" role="alert"></p><button class="primary block" id="go">' + T('Send code') + '</button>'
          : '<p class="muted" style="margin:0">' + T('We sent a 6-digit code to {phone}.', { phone: '<b dir="ltr">' + esc(prettyPhone(phone)) + '</b>' }) +
            ' <button class="ghost sm" id="chg">' + T('Change') + '</button></p>' +
            '<label class="field" for="otp">' + T('Enter the code') + '</label><input id="otp" class="otp" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code">' +
            '<p class="small err" id="err" role="alert"></p><p class="muted small" id="rs">' + T('Resend code in {s}s', { s: '<span id="cd">30</span>' }) + '</p>') +
        '</div>' +
        '<div class="banner info">' + icon('shield', 'sm') + '<span>' + T('Only numbers registered by the college can sign in. Each account sees only its own class, child or record.') + '</span></div>' +
        '<details class="card tight" id="demo-acc"><summary class="small"><span><b>' + T('Demo accounts') + '</b> ' + T('(for presenters)') + '</span></summary><div id="acc" class="small muted">Loading…</div></details>';
      if (step === 'phone') {
        var ph = $('ph'), go = $('go');
        ph.focus();
        ph.oninput = function () { ph.value = ph.value.replace(/\D/g, ''); };
        ph.onkeydown = function (e) { if (e.key === 'Enter') go.click(); };
        go.onclick = function () {
          var v = ph.value.replace(/^0/, '');
          if (!/^3\d{9}$/.test(v)) { $('perr').textContent = T('Enter a 10-digit mobile number starting with 3.'); return; }
          go.disabled = true; go.textContent = T('Sending…');
          post('auth/otp', { phone: v }).then(function (r) {
            phone = r.phone; step = 'otp'; draw();
            if (r.demoCode) smsPreview(r.demoCode);
          }, function (e) { go.disabled = false; go.textContent = T('Send code'); $('perr').textContent = errMsg(e); });
        };
      } else {
        $('chg').onclick = function () { clearInterval(timer); step = 'phone'; draw(); };
        var o = $('otp'), n = 30;
        clearInterval(timer);
        timer = setInterval(function () {
          var cd = $('cd'); if (!cd) { clearInterval(timer); return; }
          n = Math.max(0, n - 1); cd.textContent = n;
          if (!n) {
            clearInterval(timer);
            $('rs').innerHTML = '<button class="ghost sm" id="resend">' + T('Resend code') + '</button>';
            $('resend').onclick = function () {
              post('auth/otp', { phone: phone }).then(function (r) { toast(T('New code sent')); draw(); if (r.demoCode) smsPreview(r.demoCode); },
                function (e) { $('err').textContent = errMsg(e); });
            };
          }
        }, 1000);
        o.focus();
        o.oninput = function () {
          o.value = o.value.replace(/\D/g, '');
          if (o.value.length < 6) return;
          o.disabled = true;
          post('auth/verify', { phone: phone, code: o.value }).then(function (r) {
            clearInterval(timer); setToken(r.token); ME = r.me;
            if (ME.language !== LANG) post('me/language', { language: LANG }).then(function () { ME.language = LANG; }, function () {});
            var sms = document.querySelector('.sms-preview'); if (sms) sms.remove();
            location.hash = HOME[ME.role];
          }, function (e) {
            o.disabled = false; o.value = ''; o.focus(); $('err').textContent = errMsg(e);
            if (e.code === 'otp_locked' || e.code === 'otp_expired') {
              clearInterval(timer);
              $('rs').innerHTML = '<button class="ghost sm" id="resend2">' + T('Send a new code') + '</button>';
              $('resend2').onclick = function () { step = 'phone'; draw(); };
            }
          });
        };
      }
      $('demo-acc').ontoggle = function () {
        if (!this.open || this.getAttribute('data-loaded')) return;
        this.setAttribute('data-loaded', '1');
        get('demo/accounts').then(function (rows) {
          var groups = { college_admin: 'College admin', teacher: 'Teachers', student: 'Students', parent: 'Parents' };
          $('acc').innerHTML = Object.keys(groups).map(function (role) {
            return '<p style="margin:10px 0 4px"><b>' + groups[role] + '</b></p>' + rows.filter(function (r) { return r.role === role; }).map(function (r) {
              return '<button class="acc" data-p="' + esc(r.phone.slice(3)) + '"><span>' + esc(r.name) + '<br><span class="muted">' + esc(r.note) + '</span></span><code>' + esc(prettyPhone(r.phone)) + '</code></button>';
            }).join('');
          }).join('') + '<p>Tap an account to fill in its number. Any other number is refused.</p>';
          each('.acc', function (b) {
            b.onclick = function () {
              if (step !== 'phone') { step = 'phone'; draw(); }
              $('ph').value = b.getAttribute('data-p'); $('go').focus();
            };
          });
        }, function () { $('acc').textContent = 'Demo accounts are not available.'; });
      };
    }
    draw();
  };
  function smsPreview(code) {
    var old = document.querySelector('.sms-preview'); if (old) old.remove();
    var d = document.createElement('div');
    d.className = 'sms-preview'; d.setAttribute('role', 'status');
    d.innerHTML = icon('sms', 'sm') + '<div><b>SMS · EduSaas</b><br>' + T('Your sign-in code is {code}. It expires in 5 minutes.', { code: '<b dir="ltr">' + esc(code) + '</b>' }) +
      '<br><span class="small">' + T('Demo mode: shown here instead of a real SMS.') + '</span></div>';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 20000);
  }

  /* ---------- student: home ---------- */
  function lessonStatus(l) {
    var p = l.progress;
    if (p.passed) return '<span class="badge ok">' + icon('check', 'sm') + ' ' + p.best + '/5</span>';
    if (p.unlocked) return '<span class="badge warn">' + T('Quiz ready') + '</span>';
    if (p.heardShare > 0) return '<span class="badge neutral">' + T('{p}% heard', { p: Math.round(p.heardShare * 100) }) + '</span>';
    return '';
  }
  function lessonRow(l, extra) {
    return '<a class="card" href="#/lesson/' + esc(l.id) + '"><div class="lesson-row"><span class="chip">' + esc(l.topic) + '</span><div class="grow"><b>' +
      esc(l.title) + '</b><div class="meta"><span>' + icon('clock', 'sm') + mmss(l.duration) + '</span><span>' + icon('pages', 'sm') +
      T('Pages {a}–{b}', { a: l.pages[0], b: l.pages[l.pages.length - 1] }) + '</span>' + (extra || '') + '</div></div>' + lessonStatus(l) + '</div></a>';
  }
  routes.home = function () {
    app.innerHTML = banner() + skeleton(3);
    get('student/home').then(function (d) {
      var done = d.lessons.filter(function (l) { return l.progress.passed; }).length;
      var pending = d.clearances.filter(function (c) { return c.status === 'pending'; });
      var cleared = d.clearances.filter(function (c) { return c.status === 'cleared'; });
      var html = banner() +
        '<div class="hero"><div class="grow"><p class="muted" style="margin:0">' + todayLong() + '</p>' +
        '<h1>' + T('Assalam o alaikum, {name}', { name: esc(d.me.name.split(' ')[0]) }) + '</h1><p class="muted" style="margin:0">' + esc(d.me.class) + ' · ' + T('Roll {roll}', { roll: esc(d.me.roll) }) + '</p></div>' +
        '<div class="ring-wrap">' + ring(d.lessons.length ? done / d.lessons.length : 0, T('{done} of {total} topics complete', { done: done, total: d.lessons.length })) +
        '<span>' + T('{done}/{total} topics', { done: done, total: d.lessons.length }) + '</span></div></div>';
      pending.forEach(function (c) {
        html += '<div class="card alert-card" style="margin-top:16px"><div class="title">' + icon('alert') + T('Pending clearance') + '</div>' +
          '<p style="margin:6px 0 12px">' + T('You were absent on {date} and missed {topic}. Listen to the lesson and score 4/5 in the quiz to be cleared for class.',
            { date: esc(dayName(c.date)), topic: '<b>' + esc(subj(c.lesson.subject) + ' ' + c.lesson.topic + ' ' + c.lesson.title) + '</b>' }) +
          (c.attempts ? '<br><span class="muted small">' + T('Attempts: {n} · best {best}/5', { n: c.attempts, best: c.best }) + '</span>' : '') + '</p>' +
          '<a class="btn primary block" href="#/lesson/' + esc(c.lesson.id) + '">' + icon('play', 'sm') + T('Start missed lesson') + '</a></div>';
      });
      cleared.slice(0, 2).forEach(function (c) {
        html += '<div class="card ok-card" style="margin-top:12px"><div class="row">' + icon('check') + '<div><b>' + T('Cleared for class') + '</b><div class="muted small">' +
          esc(c.lesson.topic + ' ' + c.lesson.title) + ' · ' + (c.clearedBy === 'teacher' ? T('cleared by your teacher') : T('passed with {best}/5', { best: c.best })) + '</div></div></div></div>';
      });
      html += '<h2>' + T('My subjects') + '</h2>' + subjectCards(d.subjects);
      app.innerHTML = html;
    }, function (e) { app.innerHTML = errorCard(e, true); if ($('retry')) $('retry').onclick = route; });
  };

  /* ---------- student: subjects and library ---------- */
  function subjectCards(list) {
    if (!list.length) return '<div class="card muted">' + T('Your college hasn’t added subjects to your class yet.') + '</div>';
    var live = list.filter(function (x) { return x.status === 'live'; }), soon = list.filter(function (x) { return x.status !== 'live'; });
    var html = '<div class="subject-grid">' + live.map(function (x) {
      return '<a class="card subject-card" href="#/subject/' + esc(x.code) + '"><div class="row"><span class="sicon">' + subjectIcon(x.code) + '</span>' +
        '<div class="grow"><b>' + esc(subj(x.name)) + '</b><div class="meta"><span>' + T('{done} of {total} topics done', { done: x.done, total: x.total }) + '</span>' +
        (x.pending ? '<span class="badge pend">' + T('{n} missed', { n: x.pending }) + '</span>' : '') + '</div></div></div>' +
        '<div class="bar" style="margin-top:10px" aria-hidden="true"><i style="width:' + (x.total ? x.done / x.total * 100 : 0) + '%"></i></div></a>';
    }).join('') + '</div>';
    if (soon.length) {
      html += '<details class="card tight soon"><summary><span><b>' + T('Coming soon') + '</b> · ' + esc(soon.map(function (x) { return subj(x.name); }).join(LANG === 'ur' ? '، ' : ', ')) + '</span></summary>' +
        soon.map(function (x) {
          return '<a class="soon-row" href="#/subject/' + esc(x.code) + '">' + subjectIcon(x.code, 'sm') + '<span class="grow">' + esc(subj(x.name)) + '</span><span class="badge neutral">' + T('Coming soon') + '</span></a>';
        }).join('') + '</details>';
    }
    return html;
  }
  function comingSoonCard(name) {
    return '<div class="card soon-card">' + icon('clock') + '<div><b>' + T('{name} is coming soon', { name: esc(subj(name)) }) + '</b><div class="muted small">' + T('Lessons appear here after the EduSaas team produces them and your teacher approves them.') + '</div></div></div>';
  }
  function unitsHtml(units) {
    var seenLive = false, lockedHead = false;
    return units.map(function (u) {
      if (u.status === 'live') {
        seenLive = true;
        return '<h2>' + T('Unit {n}', { n: u.number }) + ' · ' + esc(u.title) + '</h2><div class="lesson-list">' + u.lessons.map(function (l) {
          return lessonRow(l, l.missed ? '<span class="badge pend">' + T('Missed') + '</span>' : '');
        }).join('') + '</div>';
      }
      var head = seenLive && !lockedHead ? '<h2>' + T('More units · coming soon') + '</h2>' : '';
      lockedHead = lockedHead || seenLive;
      return head + '<div class="card tight locked"><div class="row"><span class="chip" style="background:var(--sunk);color:var(--muted)">' + u.number +
        '</span><span class="grow">' + esc(u.title) + '</span><span class="badge neutral">' + T('Coming soon') + '</span></div></div>';
    }).join('');
  }
  routes.subject = function (code) {
    app.innerHTML = banner() + skeleton(3);
    get('student/subjects/' + encodeURIComponent(code)).then(function (d) {
      var live = d.units.filter(function (u) { return u.status === 'live'; }).length;
      app.innerHTML = banner() + '<div class="crumbs"><a href="#/home">' + icon('back', 'sm') + T('Home') + '</a></div>' +
        '<div class="row" style="margin:6px 0 4px"><span class="sicon big">' + subjectIcon(d.subject.code) + '</span><div class="grow"><h1 style="margin:0">' + esc(subj(d.subject.name)) + '</h1>' +
        '<p class="muted" style="margin:0">' + T('Grade {g}', { g: esc(d.subject.grade.replace('th', '')) }) + (d.units.length ? ' · ' + T('{live} of {n} units available', { live: live, n: d.units.length }) : '') + '</p></div></div>' +
        (d.subject.status === 'live' ? '' : comingSoonCard(d.subject.name)) + unitsHtml(d.units);
    }, function (e) {
      app.innerHTML = '<a class="crumbs" href="#/home">' + icon('back', 'sm') + T('Home') + '</a>' + errorCard(e, true);
      if ($('retry')) $('retry').onclick = route;
    });
  };
  routes.library = function (code) {
    app.innerHTML = skeleton(3);
    get('student/home').then(function (d) {
      var subs = d.subjects;
      var next = d.nextGrade && d.nextGrade.subjects.length
        ? '<h2>' + T('Grade {g} · coming soon', { g: esc(d.nextGrade.grade.replace('th', '')) }) + '</h2><div class="card tight locked"><div class="chips">' +
          d.nextGrade.subjects.map(function (n) { return '<span class="badge neutral">' + esc(subj(n)) + '</span>'; }).join('') + '</div></div>'
        : '';
      if (!subs.length) { app.innerHTML = banner() + '<h1>' + T('Course library') + '</h1>' + subjectCards(subs) + next; return; }
      var cur = subs.some(function (x) { return x.code === code; }) ? code : subs[0].code;
      app.innerHTML = banner() + '<h1>' + T('Course library') + '</h1><p class="muted">' + esc(d.me.class) + ' · ' + T('{n} subjects', { n: subs.length }) + '</p>' +
        '<div class="tabs" role="tablist" aria-label="Subjects">' + subs.map(function (x) {
          return '<a role="tab" href="#/library/' + esc(x.code) + '" aria-selected="' + (x.code === cur) + '">' + subjectIcon(x.code, 'sm') + esc(subj(x.name)) +
            (x.status === 'live' ? '' : '<small>' + T('soon') + '</small>') + '</a>';
        }).join('') + '</div><div id="lib">' + skeleton(2) + '</div>' + next +
        '<p class="muted small" style="text-align:center">' + T('Units are added as the Content Factory produces them and teachers approve them.') + '</p>';
      var sel = app.querySelector('[aria-selected="true"]'); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest', inline: 'center' });
      get('student/subjects/' + encodeURIComponent(cur)).then(function (sd) {
        if (!$('lib')) return;
        $('lib').innerHTML = (sd.subject.status === 'live' ? '' : comingSoonCard(sd.subject.name)) + unitsHtml(sd.units);
      }, function (e) { if ($('lib')) $('lib').innerHTML = errorCard(e); });
    }, function (e) { app.innerHTML = errorCard(e); });
  };

  /* ---------- zoom ---------- */
  function closeZoom() { var z = document.querySelector('.zoom'); if (z) z.remove(); }
  function openZoom(src, alt) {
    closeZoom();
    var w = Math.min(window.innerWidth * 1.6, 1400), z = document.createElement('div');
    z.className = 'zoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-label', 'Zoomed page');
    z.innerHTML = '<div class="zbar"><button id="zo" aria-label="Zoom out">' + icon('minus') + '</button><button id="zi" aria-label="Zoom in">' + icon('plus') +
      '</button><button id="zc" aria-label="Close">' + icon('cross') + '</button></div><div class="zbody"><img src="' + esc(src) + '" alt="' + esc(alt) + '" style="width:' + w + 'px"></div>';
    document.body.appendChild(z);
    var img = z.querySelector('img');
    function set(k) { w = Math.max(window.innerWidth * 0.9, Math.min(2600, w * k)); img.style.width = w + 'px'; }
    $('zi').onclick = function () { set(1.3); };
    $('zo').onclick = function () { set(1 / 1.3); };
    $('zc').onclick = closeZoom; $('zc').focus();
    z.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeZoom(); });
  }

  /* ---------- student: lesson viewer ---------- */
  routes.lesson = function (id) {
    app.innerHTML = banner() + skeleton(2);
    get('lessons/' + encodeURIComponent(id)).then(renderLesson, function (e) {
      app.innerHTML = '<a class="crumbs" href="#/home">' + icon('back', 'sm') + 'Home</a>' + errorCard(e, true);
      if ($('retry')) $('retry').onclick = route;
    });
  };
  function trackPref() { try { return localStorage.getItem('edusaas_track') || 'mix'; } catch (e) { return 'mix'; } }
  function renderLesson(l0) {
    // F12: the student picks the narration; the Urdu track has its own audio, captions and heard time.
    var track = l0.urdu && trackPref() === 'ur' ? 'ur' : 'mix';
    var l = track === 'ur' ? Object.assign({}, l0, { audio: l0.urdu.audio, script: l0.urdu.script, duration: l0.urdu.duration,
      progress: Object.assign({}, l0.progress, { heardSecs: l0.progress.heardSecsUr || [] }) }) : l0;
    if (track === 'ur') loadUrduFont();
    var rate = 1, follow = true, page = 0, playing = false, idx = 0, wake = null;
    var heard = {}, unsent = {}, unlocked = l.progress.unlocked, passed = l.progress.passed;
    l.progress.heardSecs.forEach(function (s) { heard[s] = 1; });
    var total = Math.max(1, Math.ceil(l.duration));
    var A = new Audio(l.audio); A.preload = 'metadata';

    app.innerHTML = banner() +
      '<div class="crumbs"><a href="#/home">' + icon('back', 'sm') + T('Home') + '</a><span>/</span><a href="#/subject/' + esc(l.subjectCode) + '">' + esc(subj(l.subject)) + '</a><span>/</span><span>' + T('Unit {n}', { n: esc(l.unit) }) + '</span></div>' +
      '<div class="row" style="align-items:flex-start;margin-top:4px"><span class="chip">' + esc(l.topic) + '</span><div class="grow"><h1 style="margin:0">' + esc(l.title) + '</h1>' +
      '<div class="meta"><span>' + icon('clock', 'sm') + mmss(l.duration) + '</span><span>' + icon('pages', 'sm') + T('Textbook pages {p}', { p: l.pages.join(', ') }) + '</span>' +
      (l.missed ? '<span class="badge pend">' + T('Missed lecture') + '</span>' : '') + (l.review === 'draft' ? '<span class="badge neutral">' + T('Draft, not yet reviewed') + '</span>' : '') + '</div></div></div>' +
      '<div class="lesson-grid"><div class="lesson-page"><div class="pagetabs" role="group" aria-label="Textbook pages">' + l.pages.map(function (p, k) {
        return '<button data-pg="' + k + '" aria-label="Page ' + p + '">p. ' + p + '</button>';
      }).join('') + '<label class="follow"><input type="checkbox" id="fol" checked> ' + T('Follow audio') + '</label></div>' +
      '<div class="pageframe" id="pf" role="button" tabindex="0" aria-label="Open page in zoom view"><div class="skeleton" aria-hidden="true">' +
      '<i style="width:60%"></i><i></i><i></i><i style="width:85%"></i><i></i><i style="width:70%"></i><i></i><i style="width:40%"></i></div>' +
      '<img id="pimg" alt=""><span class="zoomhint">' + icon('zoom', 'sm') + T('Tap to zoom') + '</span></div>' +
      '<p class="muted small" style="margin:6px 2px 0">' + T('Physics Grade 11, National Book Foundation. Shown for internal demo only.') + '</p></div>' +
      '<div class="lesson-side" id="lside">' + (l0.urdu ? '<div class="tracksw" role="group" aria-label="' + T('Narration') + '"><span>' + T('Narration') + '</span>' +
        '<button data-track="mix" aria-pressed="' + (track === 'mix') + '">' + T('English mix') + '</button>' +
        '<button data-track="ur" lang="ur" aria-pressed="' + (track === 'ur') + '">اردو</button></div>' : '') +
      '<div class="caption" aria-live="polite"><div class="lbl">' + T('Now explaining') + '</div><div id="cap" dir="auto"' + (track === 'ur' ? ' lang="ur"' : '') + '></div></div>' +
      '<details class="transcript"' + (matchMedia('(min-width: 960px)').matches ? ' open' : '') + '><summary>' + T(track === 'ur' ? 'Full transcript (Urdu)' : 'Full transcript (Roman Urdu)') + '</summary><div style="padding-bottom:8px">' +
      l.script.map(function (s, k) { return '<button class="seg-line" dir="auto"' + (track === 'ur' ? ' lang="ur"' : '') + ' data-seg="' + k + '">' + esc(s.x) + '</button>'; }).join('') + '</div></details></div></div>';

    var pl = document.createElement('div');
    pl.className = 'player'; pl.setAttribute('role', 'region'); pl.setAttribute('aria-label', 'Lesson audio');
    pl.innerHTML = '<div class="in"><div class="segbar" id="sb">' + l.script.map(function (s, k) {
      return '<button data-seg="' + k + '" aria-label="Section ' + (k + 1) + '"></button>';
    }).join('') + '</div><div class="times"><span id="pt"></span><span id="pl"></span></div>' +
      '<div class="controls"><button id="rw" class="skip" aria-label="Back 10 seconds">-10s</button>' +
      '<button id="pv" aria-label="Previous section">' + icon('prev') + '</button>' +
      '<button id="pp" class="play" aria-label="Play">' + icon('play') + '</button>' +
      '<button id="pn" aria-label="Next section">' + icon('next') + '</button>' +
      '<button id="ff" class="skip" aria-label="Forward 10 seconds">+10s</button>' +
      '<button id="pr" class="rate" aria-label="Playback speed">1x</button></div>' +
      '<button class="block" id="qz"></button></div>';
    // Docked to the bottom on phones; sits under the caption in the side column on wide screens.
    $('lside').insertBefore(pl, $('lside').querySelector('details.transcript'));
    var img = $('pimg'), pf = $('pf');

    function showPage(k) {
      page = k;
      each('[data-pg]', function (b) { b.setAttribute('aria-current', +b.getAttribute('data-pg') === k); });
      var src = l.images[k];
      if (img.getAttribute('src') === src) return;
      img.classList.remove('ready'); pf.querySelector('.skeleton').hidden = false;
      img.onload = function () { img.classList.add('ready'); pf.querySelector('.skeleton').hidden = true; };
      img.src = src; img.alt = 'Textbook page ' + l.pages[k];
    }
    function span(k) { return [l.script[k].t, k + 1 < l.script.length ? l.script[k + 1].t : l.duration]; }
    function isHeard(k) {
      var sp = span(k), a = Math.floor(sp[0]), b = Math.ceil(sp[1]), n = 0;
      for (var s = a; s < b; s++) if (heard[s]) n++;
      return b <= a || n / (b - a) >= 0.8;
    }
    function share() { return Math.min(1, Object.keys(heard).length / total); }
    function sectionAt(t) { var k = 0; while (k + 1 < l.script.length && l.script[k + 1].t <= t + 0.05) k++; return k; }
    function ui() {
      if (!$('pt')) return; // the student has left the lesson page
      $('pt').textContent = T('{p}% heard · section {i} of {n}', { p: Math.round(share() * 100), i: idx + 1, n: l.script.length });
      $('pl').textContent = A.ended ? T('Finished') : mmss(A.currentTime) + ' / ' + mmss(l.duration);
      var pp = $('pp'); pp.innerHTML = icon(playing ? 'pause' : 'play'); pp.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      each('#sb button', function (b, k) { b.className = (isHeard(k) ? 'heard' : '') + (k === idx ? ' on' : ''); });
      each('.seg-line', function (b) { var k = +b.getAttribute('data-seg'); b.className = 'seg-line' + (k === idx ? ' on' : '') + (isHeard(k) ? ' heard' : ''); });
      $('cap').textContent = A.ended ? T('Lesson complete. You can now take the quiz.') : l.script[idx].x;
      if (follow && !A.ended && l.script[idx].pg !== page) showPage(l.script[idx].pg);
      var q = $('qz');
      q.disabled = !unlocked;
      q.className = 'block ' + (unlocked ? 'accent' : '');
      q.innerHTML = unlocked ? icon('check', 'sm') + T(passed ? 'Retake quiz' : 'Start quiz') : icon('lock', 'sm') + T('Quiz unlocks at 90% heard');
    }
    // Report played seconds to the server; the server decides when the quiz unlocks.
    var sending = false;
    function flush(keepalive) {
      var secs = Object.keys(unsent).map(Number);
      if (!secs.length || (sending && !keepalive)) return;
      unsent = {}; sending = true;
      post('lessons/' + encodeURIComponent(l.id) + '/progress', { secs: secs, track: track }, { keepalive: keepalive }).then(function (p) {
        sending = false;
        if (p.unlocked && !unlocked) { unlocked = true; toast(T('Quiz unlocked')); }
        if ($('qz')) ui();
      }, function () { sending = false; secs.forEach(function (s) { unsent[s] = 1; }); });
    }
    var flushT = setInterval(function () { flush(false); }, 5000);
    var lastT = null;
    A.addEventListener('timeupdate', function () {
      var t = A.currentTime;
      // Only natural playback counts: a small forward step while playing, never a seek.
      if (playing && lastT !== null && t >= lastT && t - lastT < 1.5 * rate + 0.5) {
        for (var s = Math.floor(lastT); s <= Math.floor(t); s++) if (!heard[s]) { heard[s] = 1; unsent[s] = 1; }
      }
      lastT = t; idx = sectionAt(t); ui();
    });
    A.addEventListener('seeking', function () { lastT = null; });
    A.addEventListener('ended', function () { playing = false; flush(false); ui(); });
    A.addEventListener('error', function () { if (!A.getAttribute('src')) return; playing = false; ui(); toast(T('Could not load the audio. Check your connection.')); });
    leaveHooks.push(function () {
      clearInterval(flushT); flush(true);
      try { A.pause(); A.removeAttribute('src'); A.load(); } catch (e) {}
      if (wake) { try { wake.release(); } catch (e) {} }
    });
    function play() {
      if (A.ended) A.currentTime = 0;
      A.playbackRate = rate; playing = true;
      try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wake = w; }, function () {}); } catch (e) {}
      var p = A.play(); if (p && p.catch) p.catch(function () { playing = false; ui(); });
      ui();
    }
    function halt() { playing = false; A.pause(); flush(false); ui(); }
    function jumpTo(k) { k = Math.max(0, Math.min(l.script.length - 1, k)); A.currentTime = l.script[k].t + 0.01; idx = k; ui(); }

    $('pp').onclick = function () { if (playing) halt(); else play(); };
    $('pv').onclick = function () { jumpTo(A.currentTime - l.script[idx].t > 3 ? idx : idx - 1); };
    $('pn').onclick = function () { jumpTo(idx + 1); };
    $('rw').onclick = function () { A.currentTime = Math.max(0, A.currentTime - 10); ui(); };
    $('ff').onclick = function () { A.currentTime = Math.min(l.duration - 0.1, A.currentTime + 10); ui(); };
    $('pr').onclick = function () { rate = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : 1; this.textContent = rate + 'x'; A.playbackRate = rate; };
    each('[data-seg]', function (b) { b.onclick = function () { jumpTo(+b.getAttribute('data-seg')); if (!playing) play(); }; });
    each('[data-pg]', function (b) { b.onclick = function () { follow = false; $('fol').checked = false; showPage(+b.getAttribute('data-pg')); }; });
    $('fol').onchange = function () { follow = this.checked; ui(); };
    pf.onclick = function () { openZoom(l.images[page], 'Textbook page ' + l.pages[page]); };
    pf.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pf.onclick(); } };
    $('qz').onclick = function () { halt(); location.hash = '#/quiz/' + encodeURIComponent(l.id); };
    each('[data-track]', function (b) {
      b.onclick = function () {
        if (b.getAttribute('data-track') === track) return;
        try { localStorage.setItem('edusaas_track', b.getAttribute('data-track')); } catch (e) {}
        route(); // re-opens the lesson: the current track's progress is sent first by the leave hook
      };
    });

    for (var k = 0; k < l.script.length && isHeard(k); k++) {}
    idx = k >= l.script.length ? 0 : k;
    if (idx) A.currentTime = l.script[idx].t;
    showPage(l.script[idx].pg);
    ui();
  }

  /* ---------- student: quiz ---------- */
  var Q = null;
  routes.quiz = function (id) {
    app.innerHTML = skeleton(1);
    post('lessons/' + encodeURIComponent(id) + '/quiz').then(function (q) {
      Q = { id: id, data: q, i: 0, ans: [] }; drawQ();
    }, function (e) {
      app.innerHTML = '<a class="crumbs" href="#/lesson/' + esc(id) + '">' + icon('back', 'sm') + T('Back to lesson') + '</a>' +
        '<div class="card" style="text-align:center;padding:24px 16px">' + icon(e.code === 'cooldown' ? 'clock' : 'lock') + '<p><b>' + esc(errMsg(e)) + '</b></p>' +
        (e.code === 'cooldown' ? '<button class="primary" id="retry">' + T('Try again') + '</button>' : '<a class="btn primary" href="#/lesson/' + esc(id) + '">' + T('Back to lesson') + '</a>') + '</div>';
      if ($('retry')) $('retry').onclick = route;
    });
  };
  function drawQ() {
    var d = Q.data, it = d.questions[Q.i], last = Q.i === d.questions.length - 1, sel = Q.ans[Q.i];
    app.innerHTML = banner() + '<div class="crumbs"><a href="#/lesson/' + esc(Q.id) + '">' + icon('back', 'sm') + T('Back to lesson') + '</a></div>' +
      '<div class="qhead"><b>' + T('{subject} · {topic} quiz', { subject: esc(subj(d.lesson.subject)), topic: esc(d.lesson.topic) }) + '</b><span>' + T('Question {i} of {n}', { i: Q.i + 1, n: d.questions.length }) + '</span></div>' +
      '<div class="bar" style="margin:8px 0 16px"><i style="width:' + ((Q.i + 1) / d.questions.length * 100) + '%"></i></div>' +
      '<div class="card"><p class="qtext" id="qt">' + esc(it.question) + '</p><div role="radiogroup" aria-labelledby="qt">' +
      it.options.map(function (o, k) {
        return '<button class="opt" role="radio" aria-checked="' + (sel === k) + '" data-k="' + k + '"><span class="k">' + 'ABCD'[k] + '</span><span>' + esc(o) + '</span></button>';
      }).join('') + '</div></div>' +
      '<div class="row">' + (Q.i ? '<button id="bk">' + T('Back') + '</button>' : '') + '<button class="primary grow" id="nx"' + (sel === undefined ? ' disabled' : '') + '>' + T(last ? 'Submit answers' : 'Next') + '</button></div>' +
      '<p class="muted small" style="text-align:center">' + T('You need {m} of {n} correct to pass.', { m: d.passMark, n: d.size }) + '</p>';
    each('.opt', function (b) {
      b.onclick = function () {
        Q.ans[Q.i] = +b.getAttribute('data-k');
        each('.opt', function (x) { x.setAttribute('aria-checked', x === b); });
        $('nx').disabled = false;
      };
    });
    if ($('bk')) $('bk').onclick = function () { Q.i--; drawQ(); };
    $('nx').onclick = function () {
      if (!last) { Q.i++; drawQ(); return; }
      var btn = $('nx'); btn.disabled = true; btn.textContent = T('Checking…');
      post('quiz/' + Q.data.attempt + '/submit', { answers: Q.ans }).then(showResult, function (e) {
        btn.disabled = false; btn.textContent = T('Submit answers'); toast(errMsg(e));
      });
    };
  }
  function confetti() {
    var d = document.createElement('div'), cols = ['#0f8f83', '#1e3a5f', '#f5b94a', '#4ade9b', '#7aa7e8'];
    d.className = 'confetti';
    for (var i = 0; i < 40; i++) d.innerHTML += '<i style="left:' + Math.random() * 100 + '%;background:' + cols[i % 5] + ';animation-delay:' + Math.random() * .5 + 's"></i>';
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2400);
  }
  function showResult(r) {
    var id = Q.id;
    var review = '<h2>' + T('Review your answers') + '</h2>' + r.review.map(function (it) {
      return '<div class="card review ' + (it.ok ? 'right' : 'wrong') + '"><div class="row" style="align-items:flex-start">' +
        '<span class="badge ' + (it.ok ? 'ok' : 'warn') + '">' + icon(it.ok ? 'check' : 'cross', 'sm') + '</span><div class="grow"><b>' + esc(it.question) + '</b>' +
        '<div class="ans">' + (it.ok ? T('Your answer: {a}', { a: esc(it.options[it.correct]) })
          : T('You chose: {a}', { a: esc(it.chosen == null ? T('(none)') : it.options[it.chosen]) }) + '<br>' + T('Correct: {a}', { a: '<b>' + esc(it.options[it.correct]) + '</b>' })) + '</div>' +
        '<div class="muted small" style="margin-top:4px">' + esc(it.explanation) + '</div></div></div></div>';
    }).join('');
    app.innerHTML = banner() + (r.passed
      ? '<div class="result pass"><div class="icon">' + icon('check') + '</div><div class="score" dir="ltr">' + r.score + '/' + r.size + '</div><h1>' + T('Great job, you passed!') + '</h1>' +
        (r.cleared ? '<p><span class="badge ok">' + icon('check', 'sm') + ' ' + T('Cleared for class') + '</span></p><p class="muted">' + T('Your parent and your teacher have been told.') + '</p>'
          : '<p class="muted">' + T('Topic complete.') + '</p>') +
        '</div><a class="btn primary block" href="#/home">' + T('Back to home') + '</a>'
      : '<div class="result fail"><div class="icon">' + icon('refresh') + '</div><div class="score" dir="ltr">' + r.score + '/' + r.size + '</div><h1>' + T('Almost there!') + '</h1>' +
        '<p class="muted">' + T('You need {m}/{n} to pass. Review the lesson, then try again in {s} seconds.', { m: r.passMark, n: r.size, s: r.retryAfter }) +
        (r.attempts >= 3 ? '<br>' + T('Tip: listen to the lesson once more before your next try.') : '') + '</p></div>' +
        '<div class="row"><a class="btn grow" href="#/lesson/' + esc(id) + '">' + T('Review lesson') + '</a><a class="btn primary grow" href="#/quiz/' + esc(id) + '">' + T('Try again') + '</a></div>') + review;
    window.scrollTo(0, 0);
    if (r.passed) confetti();
  }

  /* ---------- teacher ---------- */
  var autoOpened = false;
  function dismissed() { try { return JSON.parse(localStorage.getItem('edusaas_dismissed') || '[]'); } catch (e) { return []; } }
  routes.teacher = function () {
    app.innerHTML = skeleton(2);
    Promise.all([get('teacher/assignments'), get('teacher/subject-requests')]).then(function (res) {
      var list = res[0], reqs = res[1], gone = dismissed();
      var open = reqs.filter(function (r) { return r.status === 'pending' || (r.status === 'declined' && gone.indexOf(r.id) < 0); });
      if (list.length === 1 && !open.length && !autoOpened) { autoOpened = true; location.hash = '#/class/' + list[0].id; return; }
      app.innerHTML = banner() + '<p class="muted" style="margin:0">' + todayLong() + '</p><h1>' + esc(ME.name) + '</h1><p class="muted">' + esc(ME.college) + '</p>' +
        '<h2 class="row between">My classes<button class="sm" id="addsub">' + icon('plus2', 'sm') + 'Add subject</button></h2>' +
        (list.length ? '<div class="lesson-list">' + list.map(function (a) {
          return '<a class="card" href="#/class/' + a.id + '"><div class="lesson-row"><span class="sicon">' + subjectIcon(a.subjectCode) + '</span><div class="grow"><b>' +
            esc(a.class) + '</b><div class="meta"><span>' + esc(a.subject) + '</span><span>' + a.students + ' students</span>' +
            (a.subjectStatus === 'live' ? '' : '<span class="badge neutral">Coming soon</span>') + '</div></div></div></a>';
        }).join('') + '</div>' : '<div class="card muted">You are not assigned to any class yet. Please contact the college admin.</div>') +
        (open.length ? '<h2>Your subject requests</h2>' + open.map(function (r) {
          var dec = r.status === 'declined';
          return '<div class="card tight' + (dec ? '' : ' locked') + '"><div class="row"><span class="sicon">' + subjectIcon(r.subject.code) + '</span><div class="grow"><b>' + esc(r.class) + '</b>' +
            '<div class="meta"><span>' + esc(r.subject.name) + '</span>' +
            (dec ? '<span class="badge pend">Declined</span>' : '<span class="badge warn">Waiting for college admin</span>') + '</div>' +
            (dec && r.note ? '<div class="muted small">' + esc(r.note) + '</div>' : '') + '</div>' +
            (dec ? '<button class="ghost sm" data-dis="' + r.id + '">Dismiss</button>' : '') + '</div></div>';
        }).join('') : '');
      each('[data-dis]', function (b) {
        b.onclick = function () {
          var ids = dismissed().concat([+b.getAttribute('data-dis')]);
          try { localStorage.setItem('edusaas_dismissed', JSON.stringify(ids)); } catch (e) {}
          routes.teacher();
        };
      });
      app.insertAdjacentHTML('beforeend', alertsCard());
      fillAlertsCard();
      $('addsub').onclick = function () { addSubject(list); };
    }, function (e) { app.innerHTML = errorCard(e); });
  };
  function addSubject(list) {
    var classes = [];
    list.forEach(function (a) { if (!classes.some(function (c) { return c.id === a.classId; })) classes.push({ id: a.classId, name: a.class, grade: a.grade }); });
    if (!classes.length) { toast('You need at least one class before you can add a subject.'); return; }
    sheet({
      title: 'Add a subject',
      body: '<p class="muted small" style="margin-top:0">Your college admin approves the request. Subjects without lessons yet show as “Coming soon”.</p>' +
        '<label class="field" for="as-c">Class</label><select id="as-c">' + classes.map(function (c) {
          return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
        }).join('') + '</select><fieldset class="choices"><legend class="field">Subject</legend><div id="as-s" class="muted small">Loading…</div></fieldset>',
      confirm: 'Send request',
      onOpen: function () {
        function load() {
          var c = classes.filter(function (x) { return x.id === $('as-c').value; })[0];
          $('as-s').innerHTML = 'Loading…';
          get('catalogue?grade=' + parseInt(c.grade, 10) + '&classId=' + encodeURIComponent(c.id)).then(function (rows) {
            if (!$('as-s')) return;
            $('as-s').className = '';
            $('as-s').innerHTML = rows.map(function (r) {
              var mine = list.some(function (a) { return a.classId === c.id && a.subjectCode === r.code; }), has = mine || r.inClass;
              return '<label class="choice' + (has ? ' locked' : '') + '"><input type="radio" name="as-sub" value="' + esc(r.code) + '"' + (has ? ' disabled' : '') + '>' +
                subjectIcon(r.code, 'sm') + '<span class="grow">' + esc(r.name) + '</span>' +
                (mine ? '<span class="badge ok">You teach this</span>' : has ? '<span class="badge neutral">Already taught here</span>' : r.status === 'live' ? '' : '<span class="badge neutral">Coming soon</span>') + '</label>';
            }).join('');
          }, function (e) { if ($('as-s')) $('as-s').textContent = e.message; });
        }
        $('as-c').onchange = load; load();
      },
      onConfirm: function (el) {
        var pick = el.querySelector('input[name=as-sub]:checked');
        if (!pick) return Promise.reject(new Error('Choose a subject.'));
        return post('teacher/subject-requests', { classId: $('as-c').value, subject: pick.value }).then(function (r) {
          toast(r.subject.name + ' requested for ' + r.class + '. Waiting for the college admin.'); routes.teacher();
        });
      }
    });
  }
  routes.class = function (aid) {
    app.innerHTML = skeleton(3);
    get('teacher/assignments/' + encodeURIComponent(aid)).then(function (d) { renderClass(aid, d); }, function (e) {
      app.innerHTML = '<a class="crumbs" href="#/teacher">' + icon('back', 'sm') + 'My classes</a>' + errorCard(e);
    });
  };
  var OVERRIDE_REASONS = ['Medical certificate provided', 'On official college duty', 'Covered the topic with the teacher in person'];
  function renderClass(aid, d) {
    if (!d.lessons.length) {
      app.innerHTML = banner() + '<div class="crumbs"><a href="#/teacher">' + icon('back', 'sm') + 'My classes</a></div>' +
        '<p class="muted" style="margin:0">' + esc(d.assignment.subject) + '</p><h1>' + esc(d.assignment.class) + '</h1>' +
        '<div class="card soon-card">' + icon('clock') + '<div><b>' + esc(d.assignment.subject) + ' lessons are coming soon</b><div class="muted small">' +
        'Attendance with missed-lesson clearance starts when the first ' + esc(d.assignment.subject) + ' lesson is approved. ' + d.students.length + ' students are in this class.</div></div></div>';
      return;
    }
    var marks = {}, topic = d.topic || (d.lessons[0] && d.lessons[0].id);
    d.students.forEach(function (s) { marks[s.id] = s.status || 'present'; });
    var saved = JSON.stringify([topic, marks]); // what the server has, so "Save changes" only lights up when something changed
    function waList() {
      var today = d.clearances.filter(function (c) { return c.whatsapp; });
      var todo = today.filter(function (c) { return !c.whatsapp.notifiedAt; });
      if (!today.length) return '';
      if (!todo.length) return '<div class="card ok-card small row">' + icon('check', 'sm') + '<span>All parents of today’s absent students have been told on WhatsApp.</span></div>';
      return '<div class="card wa-card"><div class="row between"><b>Tell parents on WhatsApp</b><span class="badge warn">' + todo.length + ' not told yet</span></div>' +
        '<p class="muted small" style="margin:4px 0 8px">Free: each button opens your WhatsApp with the message ready. Tap Send there. Parents with the app also got an alert.</p>' +
        todo.map(function (c) {
          return '<div class="att"><span class="avatar">' + esc(initials(c.student)) + '</span><div class="grow"><b>' + esc(c.whatsapp.parent) + '</b><div class="muted small">parent of ' + esc(c.student) + '</div></div>' +
            '<a class="btn sm wa-btn" target="_blank" rel="noopener" data-wa="' + c.id + '" href="https://wa.me/' + esc(c.whatsapp.phone) + '?text=' + encodeURIComponent(c.whatsapp.text) + '">' +
            icon('chat', 'sm') + 'Send on WhatsApp</a></div>';
        }).join('') + '</div>';
    }
    function draw() {
      var absent = d.students.filter(function (s) { return marks[s.id] === 'absent'; }).length;
      var pending = d.clearances.filter(function (c) { return c.status === 'pending'; });
      var dirty = !d.submitted || JSON.stringify([topic, marks]) !== saved;
      var clear = d.clearances.slice().sort(function (a, b) { return (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1); });
      var html = banner() + '<div class="crumbs"><a href="#/teacher">' + icon('back', 'sm') + 'My classes</a></div>' +
        '<p class="muted" style="margin:0">' + todayLong() + ' · ' + esc(d.assignment.subject) + '</p><h1>' + esc(d.assignment.class) + '</h1>' +
        '<div class="stats"><div class="stat ok"><b>' + (d.students.length - absent) + '</b><span>Present</span></div><div class="stat"><b>' + absent + '</b><span>Absent</span></div>' +
        '<div class="stat' + (pending.length ? ' warn' : '') + '"><b>' + pending.length + '</b><span>Pending</span></div></div>' + waList() + '<div class="class-grid">';
      html += '<section class="col-att"><h2 class="row between">' + (d.submitted ? 'Today’s attendance' : 'Take attendance') +
        (d.submitted ? '<span class="badge ok">' + icon('check', 'sm') + 'Submitted</span>' : '') + '</h2>' +
        '<label class="field" for="tp" style="margin-top:0">Topic taught today</label><select id="tp">' + d.lessons.map(function (l) {
          return '<option value="' + esc(l.id) + '"' + (topic === l.id ? ' selected' : '') + '>' + esc(l.topic + ' ' + l.title) + '</option>';
        }).join('') + '</select><p class="muted small">Absent students get this topic as their missed lecture, and their parents get an alert.</p>' +
        '<div class="card" style="padding:4px 12px">' + d.students.map(function (s) {
          var st = marks[s.id];
          return '<div class="att' + (st === 'absent' ? ' is-absent' : '') + '"><span class="avatar">' + esc(initials(s.name)) + '</span><div class="grow"><b>' + esc(s.name) + '</b>' +
            '<div class="muted small who"><span>' + esc(s.roll) + ' · ' + esc(s.parent.name) + '</span>' +
            (s.whatsappFailed ? '<span class="badge warn" title="WhatsApp failed; the alert went by SMS">SMS used</span>' : '') +
            '<button class="ghost sm inline" data-ph="' + esc(s.id) + '" aria-label="Edit parent number for ' + esc(s.name) + '" title="Edit parent number">' + icon('edit', 'sm') + '</button></div></div>' +
            '<div class="pa" role="group" aria-label="' + esc(s.name) + '"><button class="p" data-a="' + esc(s.id) + '" data-v="present" aria-pressed="' + (st === 'present') + '" aria-label="Present">P</button>' +
            '<button class="a" data-a="' + esc(s.id) + '" data-v="absent" aria-pressed="' + (st === 'absent') + '" aria-label="Absent">A</button></div></div>';
        }).join('') + '</div>' +
        '<div class="sticky-actions"><button id="allp">All present</button><button class="primary grow" id="sub"' + (dirty ? '' : ' disabled') + '>' +
        (!dirty ? icon('check', 'sm') + 'Saved' : (d.submitted ? 'Save changes' : 'Submit attendance') + (absent ? ' · ' + absent + ' absent' : '')) + '</button></div></section>';
      html += '<section class="col-clear' + (clear.length ? '' : ' empty') + '"><h2>Class clearance</h2>' + (clear.length ? clear.map(function (c) {
          var ok = c.status === 'cleared';
          return '<div class="card tight"><div class="row"><span class="avatar">' + esc(initials(c.student)) + '</span><div class="grow"><b>' + esc(c.student) + '</b>' +
            '<div class="muted small">' + esc(c.lesson.topic + ' ' + c.lesson.title) + ' · absent ' + dayName(c.date) + '</div><div class="muted small">' +
            (ok ? (c.clearedBy === 'teacher' ? 'Cleared by teacher: ' + esc(c.overrideReason) : 'Passed ' + c.best + '/5, ' + when(c.clearedAt))
              : (c.lastAttempt ? 'Last attempt ' + when(c.lastAttempt) + ' · best ' + c.best + '/5 · ' + c.attempts + ' attempt' + (c.attempts > 1 ? 's' : '') : 'Not started yet')) +
            '</div></div>' + (ok ? '<span class="badge ok">' + icon('check', 'sm') + 'Cleared</span>' : '<span class="badge pend">' + icon('cross', 'sm') + 'Pending</span>') + '</div>' +
            (ok ? '' : '<div style="text-align:right"><button class="ghost sm" data-ov="' + c.id + '">Clear manually…</button></div>') + '</div>';
        }).join('') : '<div class="card muted small">No absences yet. When you mark a student absent, their catch-up progress appears here.</div>') + '</section></div>';
      app.innerHTML = html;

      $('tp').onchange = function () { topic = this.value; draw(); };
      each('[data-wa]', function (a) {
        a.addEventListener('click', function () {
          var id = +a.getAttribute('data-wa');
          post('teacher/clearances/' + id + '/whatsapp-sent').then(function (r) {
            d.clearances.forEach(function (c) { if (c.id === id && c.whatsapp) c.whatsapp.notifiedAt = r.notifiedAt; });
            draw();
          }, function (e) { toast(e.message); });
        });
      });
      each('[data-a]', function (b) { b.onclick = function () { marks[b.getAttribute('data-a')] = b.getAttribute('data-v'); draw(); }; });
      $('allp').onclick = function () { Object.keys(marks).forEach(function (k) { marks[k] = 'present'; }); draw(); };
      $('sub').onclick = function () {
        var btn = this; btn.disabled = true; btn.textContent = 'Saving…';
        post('teacher/assignments/' + aid + '/attendance', { lesson: topic, statuses: marks }).then(function (r) {
          toast('Attendance saved.' + (r.alertsSent ? ' ' + r.alertsSent + ' parent' + (r.alertsSent > 1 ? 's' : '') + ' alerted in the app. Tell them on WhatsApp too.' : ''));
          routes.class(aid);
        }, function (e) { btn.disabled = false; btn.textContent = 'Try again'; toast(e.message); });
      };
      each('[data-ov]', function (b) {
        b.onclick = function () {
          var c = d.clearances.filter(function (x) { return String(x.id) === b.getAttribute('data-ov'); })[0];
          sheet({
            title: 'Clear ' + c.student + ' manually',
            body: '<p class="muted small" style="margin-top:0">' + esc(c.lesson.topic + ' ' + c.lesson.title) + '. The reason is saved with the record, and the parent gets an alert.</p>' +
              '<fieldset class="choices"><legend class="field">Reason</legend>' + OVERRIDE_REASONS.concat(['Other']).map(function (r, k) {
                return '<label class="choice"><input type="radio" name="rsn" value="' + esc(r) + '"' + (k ? '' : ' checked') + '><span>' + esc(r) + '</span></label>';
              }).join('') + '</fieldset><textarea id="rsn-o" rows="2" maxlength="200" placeholder="Write the reason" hidden aria-label="Other reason"></textarea>',
            confirm: 'Clear for class',
            onOpen: function (el) {
              Array.prototype.forEach.call(el.querySelectorAll('input[name=rsn]'), function (r) {
                r.onchange = function () { var o = $('rsn-o'); o.hidden = r.value !== 'Other'; if (!o.hidden) o.focus(); };
              });
            },
            onConfirm: function (el) {
              var r = el.querySelector('input[name=rsn]:checked').value;
              if (r === 'Other') r = $('rsn-o').value.trim();
              if (r.length < 3) return Promise.reject(new Error('Write a short reason, for example “Medical certificate provided”.'));
              return post('teacher/clearances/' + c.id + '/override', { reason: r }).then(function (res) {
                toast(res.student + ' cleared. Parent notified.'); routes.class(aid);
              });
            }
          });
        };
      });
      each('[data-ph]', function (b) {
        b.onclick = function () {
          var s = d.students.filter(function (x) { return x.id === b.getAttribute('data-ph'); })[0];
          sheet({
            title: 'Parent’s mobile number',
            body: '<p class="muted small" style="margin-top:0">' + esc(s.parent.name) + ', parent of ' + esc(s.name) + '. Absence alerts go to this number.</p>' +
              '<label class="field" for="pp-in">Mobile number</label><div class="phone"><span>+92</span><input id="pp-in" type="tel" inputmode="numeric" maxlength="11" autocomplete="off" value="' +
              esc(s.parent.phone.replace(/^\+92/, '')) + '"></div>',
            confirm: 'Save number',
            onOpen: function () { var i = $('pp-in'); i.select(); i.oninput = function () { i.value = i.value.replace(/\D/g, ''); }; },
            onConfirm: function () {
              var v = $('pp-in').value.replace(/^0/, '');
              if (!/^3\d{9}$/.test(v)) return Promise.reject(new Error('Enter a 10-digit mobile number starting with 3.'));
              return post('teacher/students/' + s.id + '/parent-phone', { phone: '0' + v }).then(function (r) {
                s.parent = r.parent; toast('Parent number updated to ' + prettyPhone(r.parent.phone)); draw();
              });
            }
          });
        };
      });
    }
    draw();
  }

  /* ---------- parent ---------- */
  function lastActive(iso) {
    if (!iso) return T('No lessons started yet');
    var days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 864e5);
    return days === 0 ? T('Last studied today at {t}', { t: hm(iso) }) : days === 1 ? T('Last studied yesterday') : T('Last studied {n} days ago', { n: days });
  }
  function childCard(c) {
    var pending = c.clearances.filter(function (x) { return x.status === 'pending'; }), s = c.summary;
    var stat = function (v, label, cls) { return '<div class="stat' + (cls ? ' ' + cls : '') + '"><b>' + v + '</b><span>' + label + '</span></div>'; };
    var att = s.attendanceRate30d == null ? '–' : s.attendanceRate30d + '%';
    return '<div class="card child-card"><div class="row"><span class="avatar">' + esc(initials(c.name)) + '</span><div class="grow"><b>' + esc(c.name) + '</b><div class="muted small">' +
      esc(c.class) + ' · ' + T('Roll {roll}', { roll: esc(c.roll) }) + '</div></div>' +
      (pending.length ? '<span class="badge warn">' + icon('alert', 'sm') + T('{n} to clear', { n: pending.length }) + '</span>' : '<span class="badge ok">' + icon('check', 'sm') + T('Up to date') + '</span>') + '</div>' +
      '<div class="stats">' +
      stat(att, s.attendanceRate30d == null ? T('No attendance yet') : T('Attendance') + '<br>' + T('{p} of {t} classes, 30 days', { p: s.attendanceClasses30d.present, t: s.attendanceClasses30d.total }),
        s.attendanceRate30d != null && s.attendanceRate30d < 75 ? 'warn' : 'ok') +
      stat(s.topicsDone + '/' + s.topicsTotal, T('Topics done')) +
      stat(s.avgScore == null ? '–' : s.avgScore + '<small>/5</small>', T('Average quiz score')) + '</div>' +
      c.clearances.map(function (x) {
        return '<div class="small clr-line">' + (x.status === 'pending'
          ? icon('alert', 'sm') + '<span>' + T('Absent {date}: must complete {topic}', { date: esc(dayName(x.date)), topic: '<b>' + esc(subj(x.lesson.subject) + ' ' + x.lesson.topic + ' ' + x.lesson.title) + '</b>' }) + ' ' +
            (x.attempts ? T(x.attempts > 1 ? '({n} attempts, best {best}/5)' : '({n} attempt, best {best}/5)', { n: x.attempts, best: x.best }) : T('(not started yet)')) + '</span>'
          : icon('check', 'sm') + '<span>' + T('Cleared {topic}, {when}', { topic: esc(subj(x.lesson.subject) + ' ' + x.lesson.topic + ' ' + x.lesson.title), when: esc(when(x.clearedAt)) }) + '</span>') + '</div>';
      }).join('') +
      '<div class="muted small" style="margin:14px 0 4px">' + T('Subjects') + '</div>' + (c.subjects.length ? c.subjects.map(function (x) {
        var live = x.status === 'live';
        var inner = subjectIcon(x.code, 'sm') + '<span class="grow"><b>' + esc(subj(x.name)) + '</b><span class="muted small"> · ' +
          (live ? T('{done} of {total} topics', { done: x.done, total: x.total }) + (x.avgScore != null ? ' · ' + T('avg {a}/5', { a: x.avgScore }) : '') : T('Coming soon')) + '</span>' +
          (live ? '<span class="bar" aria-hidden="true"><i style="width:' + (x.total ? x.done / x.total * 100 : 0) + '%"></i></span>' : '') + '</span>';
        return live ? '<a class="subj-line" href="#/child/' + esc(c.id) + '/' + esc(x.code) + '">' + inner + icon('chev', 'sm') + '</a>'
          : '<div class="subj-line locked">' + inner + '</div>';
      }).join('') : '<p class="muted small">' + T('The college hasn’t added subjects yet.') + '</p>') +
      (c.attendance.length ? '<div class="muted small" style="margin-top:12px">' + T('Recent attendance') + '</div><div class="attstrip" aria-label="' + T('Recent attendance') + '">' + c.attendance.slice(0, 7).reverse().map(function (a) {
        return '<span class="' + esc(a.status) + '" title="' + esc(dayName(a.date) + ' · ' + subj(a.subject) + ': ' + a.status) + '">' + esc(new Date(a.date + 'T00:00:00').toLocaleDateString(LOC(), { weekday: 'short' })) + '<br>' + T(a.status === 'absent' ? 'A' : 'P') + '</span>';
      }).join('') + '</div>' : '') +
      '<p class="muted small" style="margin:12px 0 0">' + icon('clock', 'sm') + ' ' + esc(lastActive(s.lastActive)) +
      (s.medianDaysToClear != null ? ' · ' + T(s.medianDaysToClear === 1 ? 'usually clears missed lectures in {n} day' : 'usually clears missed lectures in {n} days', { n: s.medianDaysToClear }) : '') + '</p></div>';
  }
  routes.parent = function () {
    app.innerHTML = skeleton(2);
    Promise.all([get('parent/home'), get('messages')]).then(function (res) {
      var d = res[0], msgs = res[1];
      var html = banner() + '<p class="muted" style="margin:0">' + todayLong() + '</p><h1>' + esc(d.me.name) + '</h1><p class="muted">' + esc(d.me.college) + '</p>' +
        '<div class="children">' + d.children.map(childCard).join('') + '</div>' +
        alertsCard() + '<h2>' + T('Messages from the college') + '</h2>' + chat(msgs.slice(-4), false) +
        (msgs.length > 4 ? '<p style="text-align:center"><a href="#/msgs">' + T('See all {n} messages', { n: msgs.length }) + '</a></p>' : '') +
        '<div class="card row toggle-row"><div class="grow"><b>' + T('Weekly summary') + '</b><div class="muted small">' + T('Every Sunday evening, a short progress report in Messages.') + '</div></div>' +
        '<label class="switch"><input type="checkbox" id="wk"' + (d.weeklySummary ? ' checked' : '') + ' aria-label="' + T('Weekly summary') + '"><span></span></label></div>';
      app.innerHTML = html;
      fillAlertsCard();
      $('wk').onchange = function () {
        var box = this, v = box.checked; box.disabled = true;
        post('parent/settings', { weeklySummary: v }).then(function () {
          box.disabled = false; toast(T(v ? 'Weekly summary turned on' : 'Weekly summary turned off'));
        }, function (e) { box.disabled = false; box.checked = !v; toast(e.message); });
      };
    }, function (e) { app.innerHTML = errorCard(e, true); if ($('retry')) $('retry').onclick = route; });
  };
  var TOPIC_STATE = {
    passed: ['ok', 'check', 'Passed'], quiz_ready: ['warn', 'lock', 'Quiz ready'],
    listening: ['neutral', 'clock', 'Listening'], not_started: ['neutral', 'minus', 'Not started']
  };
  routes.child = function (sid, code) {
    app.innerHTML = skeleton(3);
    get('parent/children/' + encodeURIComponent(sid) + '/subjects/' + encodeURIComponent(code)).then(function (d) {
      var html = banner() + '<div class="crumbs"><a href="#/parent">' + icon('back', 'sm') + esc(d.child.name) + '</a></div>' +
        '<div class="row" style="margin:6px 0 4px"><span class="sicon big">' + subjectIcon(d.subject.code) + '</span><div class="grow"><h1 style="margin:0">' + esc(subj(d.subject.name)) + '</h1>' +
        '<p class="muted" style="margin:0">' + esc(d.child.name + ' · ' + d.child.class) + '</p></div></div>' +
        '<div class="banner info">' + icon('shield', 'sm') + '<span>' + T('After each lesson there is a {q}-question quiz. {p} correct answers is a pass. A missed lecture is cleared when the quiz is passed.', { q: d.quizSize, p: d.passMark }) + '</span></div>';
      d.units.forEach(function (u) {
        if (u.status !== 'live') return;
        html += '<h2>' + T('Unit {n}', { n: u.number }) + ' · ' + esc(u.title) + '</h2><div class="card" style="padding:4px 12px">' + u.topics.map(function (t) {
          var st = TOPIC_STATE[t.status], label = T(st[2]) + (t.status === 'passed' ? ' ' + t.best + '/5' : t.status === 'listening' ? ' (' + T('{p}% heard', { p: Math.round(t.heardShare * 100) }) + ')' : '');
          return '<div class="att"><span class="chip">' + esc(t.topic) + '</span><div class="grow"><b>' + esc(t.title) + '</b>' +
            (t.missed ? '<div class="small" style="color:var(--warn)">' + T('Missed lecture, not cleared yet') + '</div>' : t.cleared ? '<div class="small" style="color:var(--ok)">' + T('Missed, now cleared') + '</div>' : '') +
            '</div><span class="badge ' + st[0] + '">' + icon(st[1], 'sm') + esc(label) + '</span></div>';
        }).join('') + '</div>';
      });
      var soon = d.units.filter(function (u) { return u.status !== 'live'; }).length;
      if (soon) html += '<p class="muted small" style="text-align:center">' + T(soon > 1 ? '{n} more units coming soon.' : '{n} more unit coming soon.', { n: soon }) + '</p>';
      app.innerHTML = html;
    }, function (e) {
      app.innerHTML = '<a class="crumbs" href="#/parent">' + icon('back', 'sm') + T('My child') + '</a>' + errorCard(e, true);
      if ($('retry')) $('retry').onclick = route;
    });
  };

  /* ---------- messages ---------- */
  function deliveredBy(m) {
    if (m.manual) return T('WhatsApp, sent by the teacher');
    if (m.channel === 'inbox') return T('In app') + (m.pushed && m.pushed.ok ? ' · ' + T(m.pushed.ok > 1 ? 'sent to {n} phones' : 'sent to {n} phone', { n: m.pushed.ok }) : '');
    return { whatsapp: 'WhatsApp', sms: 'SMS' }[m.channel] || m.channel;
  }
  function chat(list, isTeacher) {
    var html = '<div class="wa"><div class="head"><span class="avatar">' + icon('book', 'sm') + '</span><div><b>' + esc(ME.college || T('Your college')) +
      '</b><div class="small" style="opacity:.8">' + (isTeacher ? 'Alerts sent to parents and teachers' : T('Alerts and messages from the college')) + '</div></div></div><div class="body">';
    if (!list.length) html += '<p class="muted" style="text-align:center;padding:30px 8px">' + T('No messages yet.') + '</p>';
    list.forEach(function (m) {
      var bad = m.status === 'failed' || m.status === 'skipped';
      html += '<div class="bubble' + (bad ? ' failed' : '') + '">' +
        (isTeacher ? '<div class="to">To ' + esc(m.toRole) + ': ' + esc(m.to) + ' · ' + esc(prettyPhone(m.phone)) + '</div>' : '') +
        '<div dir="auto">' + esc(m.body) + '</div><div class="foot">' + deliveredBy(m) + ' · ' + when(m.at) + ' ' +
        (m.status === 'failed' ? '✖ ' + esc(m.channel) + ' failed: ' + esc(m.error) : m.status === 'skipped' ? 'not sent: ' + esc(m.error) : m.channel === 'inbox' ? '' : '✓✓') + '</div></div>';
    });
    return html + '</div></div>';
  }
  routes.msgs = function () {
    app.innerHTML = skeleton(2);
    get('messages').then(function (list) {
      var isT = ME.role === 'teacher';
      app.innerHTML = banner() + '<h1>' + (isT ? 'Alerts log' : T('Messages')) + '</h1><p class="muted">' +
        (isT ? 'Every alert about students in your classes: in-app alerts, phone notifications, and the WhatsApp messages you sent.' : T('Messages sent to you by the college.')) + '</p>' +
        chat(list, isT) + '<p class="muted small" style="margin-top:12px">' + T('Alerts are free: they stay in this app and go to phones that turned on alerts. Messages marked “WhatsApp, sent by the teacher” were sent from the teacher’s own WhatsApp.') + '</p>';
    }, function (e) { app.innerHTML = errorCard(e); });
  };

  /* ---------- college admin console (F22) ---------- */
  function call2(method, path, body) { return call(method, path, body); }
  function activityList(rows) {
    if (!rows.length) return '<div class="card muted small">No activity yet.</div>';
    return '<div class="card" style="padding:4px 12px">' + rows.map(function (a) {
      return '<div class="att"><div class="grow"><div>' + esc(a.summary) + '</div><div class="muted small">' + esc((a.actor || 'EduSaas team') + ' · ' + when(a.at)) + '</div></div></div>';
    }).join('') + '</div>';
  }
  routes.admin = function () {
    app.innerHTML = skeleton(3);
    get('admin/overview').then(function (d) {
      var c = d.counts, stat = function (v, l, href) { return '<a class="stat" href="' + href + '"><b>' + v + '</b><span>' + l + '</span></a>'; };
      app.innerHTML = banner() + '<p class="muted" style="margin:0">' + todayLong() + '</p><h1>' + esc(d.college) + '</h1><p class="muted">College admin · ' + esc(ME.name) + '</p>' +
        '<div class="stats four">' + stat(c.students, 'Students', '#/people/student') + stat(c.teachers, 'Teachers', '#/people/teacher') +
        stat(c.parents, 'Parents', '#/people/parent') + stat(c.classes, 'Classes', '#/classes') + '</div>' +
        '<h2>Subject requests' + (d.requests.length ? ' <span class="badge warn">' + d.requests.length + ' waiting</span>' : '') + '</h2>' +
        (d.requests.length ? d.requests.map(function (r) {
          return '<div class="card tight"><div class="row"><span class="sicon">' + subjectIcon(r.subject.code) + '</span><div class="grow"><b>' + esc(r.subject.name + ' for ' + r.class) + '</b>' +
            '<div class="muted small">Asked by ' + esc(r.teacher) + ' · ' + when(r.createdAt) + (r.subject.status === 'live' ? '' : ' · no lessons yet (Coming soon)') + '</div></div></div>' +
            '<div class="row" style="justify-content:flex-end;margin-top:8px"><button class="sm" data-dec="' + r.id + '">Decline…</button><button class="sm primary" data-app="' + r.id + '">Approve</button></div></div>';
        }).join('') : '<div class="card muted small">No requests waiting. Teachers ask for subjects from “My classes → Add subject”.</div>') +
        '<h2 class="row between">Recent activity <a class="small" href="#/activity">See all</a></h2>' + activityList(d.activity);
      each('[data-app]', function (b) {
        b.onclick = function () {
          b.disabled = true;
          post('admin/subject-requests/' + b.getAttribute('data-app') + '/decide', { approve: true }).then(function (r) {
            toast(r.subject.name + ' added to ' + r.class + '.'); routes.admin();
          }, function (e) { b.disabled = false; toast(e.message); });
        };
      });
      each('[data-dec]', function (b) {
        b.onclick = function () {
          sheet({ title: 'Decline this request', confirm: 'Decline',
            body: '<label class="field" for="dn">Note for the teacher (optional)</label><textarea id="dn" rows="3" maxlength="200" placeholder="For example: Ms. Hira already teaches this class"></textarea>',
            onConfirm: function () {
              return post('admin/subject-requests/' + b.getAttribute('data-dec') + '/decide', { approve: false, note: $('dn').value.trim() })
                .then(function () { toast('Request declined. The teacher will see your note.'); routes.admin(); });
            } });
        };
      });
    }, function (e) { app.innerHTML = errorCard(e, true); if ($('retry')) $('retry').onclick = route; });
  };
  routes.activity = function () {
    app.innerHTML = skeleton(3);
    get('admin/audit').then(function (rows) {
      app.innerHTML = banner() + '<div class="crumbs"><a href="#/admin">' + icon('back', 'sm') + 'Home</a></div><h1>Activity log</h1>' +
        '<p class="muted">Every change in your college: who did it and when. Phone numbers are partly hidden.</p>' + activityList(rows);
    }, function (e) { app.innerHTML = errorCard(e); });
  };

  var ROLE_TABS = [['student', 'Students'], ['teacher', 'Teachers'], ['parent', 'Parents']];
  function personLine(p) {
    var sub = p.role === 'student' ? esc((p.class || '') + ' · Roll ' + (p.roll || '') + ' · parent ' + (p.parent ? p.parent.name : ''))
      : p.role === 'teacher' ? (p.assignments.length ? esc(p.assignments.join(', ')) : 'No classes yet')
      : (p.children.length ? 'Parent of ' + esc(p.children.join(', ')) : 'No children linked');
    return '<button class="person' + (p.active ? '' : ' off') + '" data-pid="' + esc(p.id) + '"><span class="avatar">' + esc(initials(p.name)) + '</span>' +
      '<span class="grow"><b>' + esc(p.name) + '</b>' + (p.active ? '' : ' <span class="badge pend">Suspended</span>') +
      '<span class="muted small">' + esc(prettyPhone(p.phone)) + ' · ' + sub + '</span></span>' + icon('chev', 'sm') + '</button>';
  }
  function phoneField(id, label, value) {
    return '<label class="field" for="' + id + '">' + label + '</label><div class="phone"><span>+92</span><input id="' + id +
      '" type="tel" inputmode="numeric" maxlength="11" autocomplete="off" value="' + esc(value ? value.replace(/^\+92/, '') : '') + '"></div>';
  }
  function textField(id, label, value, ph) {
    return '<label class="field" for="' + id + '">' + label + '</label><input id="' + id + '" type="text" value="' + esc(value || '') + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>';
  }
  function genderField(id, value) {
    return '<label class="field" for="' + id + '">Gender</label><select id="' + id + '"><option value="male"' + (value === 'male' ? ' selected' : '') +
      '>Male</option><option value="female"' + (value === 'female' ? ' selected' : '') + '>Female</option></select>';
  }
  function digits(id) { var v = ($(id).value || '').replace(/\D/g, '').replace(/^0/, ''); return v; }
  routes.people = function (role) {
    role = ROLE_TABS.some(function (r) { return r[0] === role; }) ? role : 'student';
    var q = '', timer = null, classes = null;
    app.innerHTML = banner() + '<h1 class="row between">People<button class="sm primary" id="padd">' + icon('plus2', 'sm') + 'Add</button></h1>' +
      '<div class="tabs" role="tablist">' + ROLE_TABS.map(function (r) {
        return '<a role="tab" href="#/people/' + r[0] + '" aria-selected="' + (r[0] === role) + '">' + r[1] + '</a>';
      }).join('') + '</div><input type="text" id="pq" placeholder="Search by name, phone or roll number" aria-label="Search">' +
      '<div id="plist" style="margin-top:10px">' + skeleton(3) + '</div>';
    function load() {
      get('admin/people?role=' + role + (q ? '&q=' + encodeURIComponent(q) : '')).then(function (rows) {
        if (!$('plist')) return;
        $('plist').innerHTML = rows.length ? '<div class="card" style="padding:4px 8px">' + rows.map(personLine).join('') + '</div>' +
          '<p class="muted small" style="text-align:center">' + rows.length + ' shown</p>'
          : '<div class="card muted small">' + (q ? 'Nobody matches “' + esc(q) + '”.' : 'Nobody here yet. Use Add, or import a file.') + '</div>';
        each('[data-pid]', function (b) { b.onclick = function () { editPerson(rows.filter(function (x) { return x.id === b.getAttribute('data-pid'); })[0]); }; });
      }, function (e) { if ($('plist')) $('plist').innerHTML = errorCard(e); });
    }
    function withClasses(fn) {
      if (classes) return fn(classes);
      get('admin/classes').then(function (c) { classes = c; fn(c); }, function (e) { toast(e.message); });
    }
    function classSelect(list, value) {
      return '<label class="field" for="pc">Class</label><select id="pc">' + list.map(function (c) {
        return '<option value="' + esc(c.id) + '"' + (c.id === value ? ' selected' : '') + '>' + esc(c.name) + '</option>';
      }).join('') + '</select>';
    }
    $('pq').oninput = function () { clearTimeout(timer); var v = this.value.trim(); timer = setTimeout(function () { q = v; load(); }, 300); };
    $('padd').onclick = function () {
      withClasses(function (list) {
        if (role === 'student' && !list.length) { toast('Create a class first, under Classes.'); return; }
        var label = { student: 'student', teacher: 'teacher', parent: 'parent' }[role];
        sheet({ title: 'Add a ' + label, confirm: 'Add ' + label,
          body: textField('pn', 'Full name') + phoneField('pp', 'Mobile number') + genderField('pg', role === 'parent' ? 'female' : 'male') +
            (role === 'student' ? classSelect(list) + textField('pr', 'Roll number', '', 'e.g. 11A-07') +
              '<div class="sheet-sub">Parent</div>' + phoneField('ppp', 'Parent’s mobile number') +
              textField('ppn', 'Parent’s full name', '', 'Leave blank if the parent is already registered') : '') +
            '<p class="muted small">They sign in with this number. Nobody else can use it.</p>',
          onConfirm: function () {
            var body = { role: role, name: $('pn').value.trim(), phone: digits('pp'), gender: $('pg').value };
            if (role === 'student') { body.classId = $('pc').value; body.roll = $('pr').value.trim(); body.parentPhone = digits('ppp'); body.parentName = $('ppn').value.trim(); }
            return post('admin/people', body).then(function (p) { toast(p.name + ' added.'); load(); });
          } });
      });
    };
    function editPerson(p) {
      withClasses(function (list) {
        var el = sheet({ title: p.name, confirm: 'Save changes',
          body: textField('pn', 'Full name', p.name) + phoneField('pp', 'Mobile number', p.phone) +
            (p.role === 'student' ? classSelect(list, p.classId) + textField('pr', 'Roll number', p.roll) +
              '<p class="muted small">Parent: ' + esc(p.parent.name + ', ' + prettyPhone(p.parent.phone)) + '. Open the Parents tab to change the parent’s details.</p>' : '') +
            '<div class="sheet-sub">Account</div>' + (p.active
              ? '<p class="muted small" style="margin:4px 0">Suspending signs them out and stops them signing in. Records are kept.</p>' + textField('sr', 'Reason for suspending', '', 'e.g. Left the college') +
                '<button class="block" id="psus" style="margin-top:8px;color:var(--bad)">Suspend account</button>'
              : '<p class="small"><span class="badge pend">Suspended</span></p><button class="block" id="preac">Reactivate account</button>'),
          onConfirm: function () {
            var body = { name: $('pn').value.trim(), phone: digits('pp') };
            if (p.role === 'student') { body.classId = $('pc').value; body.roll = $('pr').value.trim(); }
            return post('admin/people/' + p.id, body).then(function () { toast('Saved.'); load(); });
          } });
        function setActive(active) {
          var body = { active: active };
          if (!active) body.reason = $('sr').value.trim();
          post('admin/people/' + p.id, body).then(function () { closeSheet(); toast(p.name + (active ? ' reactivated.' : ' suspended.')); load(); },
            function (e) { $('sh-err').textContent = e.message; });
        }
        if ($('psus')) $('psus').onclick = function () { setActive(false); };
        if ($('preac')) $('preac').onclick = function () { setActive(true); };
        return el;
      });
    }
    load();
  };

  routes.classes = function () {
    app.innerHTML = skeleton(3);
    get('admin/classes').then(function (list) {
      app.innerHTML = banner() + '<h1 class="row between">Classes<button class="sm primary" id="cadd">' + icon('plus2', 'sm') + 'New class</button></h1>' +
        (list.length ? '<div class="lesson-list">' + list.map(function (c) {
          return '<div class="card"><div class="row"><span class="chip">' + esc(c.section) + '</span><div class="grow"><b>' + esc(c.name) + '</b><div class="muted small">' +
            esc(c.academicYear + ' · ' + { male: 'Boys', female: 'Girls', mixed: 'Mixed' }[c.gender] + ' · ' + c.students + ' students') + '</div></div></div>' +
            '<div class="muted small" style="margin:10px 0 4px">Teachers</div>' + (c.assignments.length ? c.assignments.map(function (a) {
              return '<div class="asg">' + subjectIcon(a.subjectCode, 'sm') + '<span class="grow"><b>' + esc(a.subject) + '</b> · ' + esc(a.teacher) + '</span>' +
                '<button class="ghost sm inline" data-rm="' + a.id + '" aria-label="Remove ' + esc(a.teacher + ' from ' + a.subject) + '">' + icon('cross', 'sm') + '</button></div>';
            }).join('') : '<p class="muted small" style="margin:0">No teachers yet.</p>') +
            '<button class="sm" data-asg="' + esc(c.id) + '" style="margin-top:8px">' + icon('plus2', 'sm') + 'Assign teacher</button></div>';
        }).join('') + '</div>' : '<div class="card muted small">No classes yet. Create one, then add students.</div>');
      $('cadd').onclick = function () {
        sheet({ title: 'New class', confirm: 'Create class',
          body: '<label class="field" for="cg">Grade</label><select id="cg"><option>11th</option><option>12th</option></select>' +
            textField('cs', 'Stream', '', 'e.g. Pre-Medical') + textField('cx', 'Section', '', 'e.g. A') +
            '<label class="field" for="cgen">Students</label><select id="cgen"><option value="male">Boys</option><option value="female">Girls</option><option value="mixed">Mixed</option></select>' +
            textField('cy', 'Academic year', '2026-2027'),
          onConfirm: function () {
            return post('admin/classes', { grade: $('cg').value, stream: $('cs').value.trim(), section: $('cx').value.trim(), gender: $('cgen').value,
              academicYear: $('cy').value.trim() }).then(function (c) { toast(c.name + ' created.'); routes.classes(); });
          } });
      };
      each('[data-rm]', function (b) {
        b.onclick = function () {
          sheet({ title: 'Remove this teacher?', confirm: 'Remove',
            body: '<p class="muted small" style="margin-top:0">' + esc(b.getAttribute('aria-label')) + '. Attendance and clearances already recorded are kept.</p>',
            onConfirm: function () {
              return call2('DELETE', 'admin/assignments/' + b.getAttribute('data-rm')).then(function () { toast('Removed.'); routes.classes(); });
            } });
        };
      });
      each('[data-asg]', function (b) {
        b.onclick = function () {
          var c = list.filter(function (x) { return x.id === b.getAttribute('data-asg'); })[0];
          Promise.all([get('admin/people?role=teacher'), get('catalogue?grade=' + parseInt(c.grade, 10))]).then(function (res) {
            var teachers = res[0].filter(function (t) { return t.active; }), subjects = res[1];
            if (!teachers.length) { toast('Add a teacher first, under People.'); return; }
            sheet({ title: 'Assign a teacher to ' + c.name, confirm: 'Assign',
              body: '<label class="field" for="at">Teacher</label><select id="at">' + teachers.map(function (t) { return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>'; }).join('') + '</select>' +
                '<label class="field" for="as">Subject</label><select id="as">' + subjects.map(function (x) {
                  return '<option value="' + esc(x.code) + '">' + esc(x.name) + (x.status === 'live' ? '' : ' (coming soon)') + '</option>';
                }).join('') + '</select>',
              onConfirm: function () {
                return post('admin/assignments', { teacherId: $('at').value, classId: c.id, subject: $('as').value }).then(function () { toast('Teacher assigned.'); routes.classes(); });
              } });
          }, function (e) { toast(e.message); });
        };
      });
    }, function (e) { app.innerHTML = errorCard(e, true); if ($('retry')) $('retry').onclick = route; });
  };

  var TEMPLATES = {
    students: 'class_grade,class_stream,class_section,roll_number,student_name,student_gender,student_phone,parent_name,parent_phone\n' +
      '11th,Pre-Medical,A,11A-21,Imran Ali,male,03001234567,Mr. Ali Khan,03007654321\n',
    teachers: 'teacher_name,teacher_phone,teacher_gender,subject,class_grade,class_stream,class_section\n' +
      'Ms. Hira Saleem,03001112233,female,English,11th,Pre-Medical,A\n'
  };
  routes.import = function (kind) {
    kind = kind === 'teachers' ? 'teachers' : 'students';
    var href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(TEMPLATES[kind]);
    app.innerHTML = banner() + '<h1>Import</h1><p class="muted">Add a whole class, or all your teachers, from a spreadsheet saved as CSV.</p>' +
      '<div class="tabs" role="tablist"><a role="tab" href="#/import/students" aria-selected="' + (kind === 'students') + '">Students and parents</a>' +
      '<a role="tab" href="#/import/teachers" aria-selected="' + (kind === 'teachers') + '">Teachers</a></div>' +
      '<div class="card"><ol class="steps"><li><a href="' + href + '" download="edusaas-' + kind + '-template.csv">Download the template</a> and fill it in (Excel: File → Save as → CSV).</li>' +
      '<li>Choose the file, or paste its contents below.</li><li><b>Check file</b>. Nothing is saved until you press <b>Import</b>.</li></ol>' +
      '<input type="file" id="if" accept=".csv,text/csv" aria-label="CSV file"><textarea id="it" rows="6" placeholder="' + esc(TEMPLATES[kind].split('\n')[0]) + '" aria-label="CSV contents" style="margin-top:8px"></textarea>' +
      '<button class="primary block" id="ic" style="margin-top:10px">Check file</button></div><div id="ir"></div>';
    $('if').onchange = function () {
      var f = this.files[0]; if (!f) return;
      var rd = new FileReader(); rd.onload = function () { $('it').value = rd.result; }; rd.readAsText(f);
    };
    $('ic').onclick = function () {
      var btn = this; btn.disabled = true; btn.textContent = 'Checking…';
      post('admin/imports', { kind: kind, csv: $('it').value }).then(function (r) {
        btn.disabled = false; btn.textContent = 'Check file';
        var ok = !r.errors.length;
        $('ir').innerHTML = '<div class="card ' + (ok ? 'ok-card' : 'alert-card') + '"><b>' + (ok ? 'Ready to import ' + r.counts.ok + ' row' + (r.counts.ok === 1 ? '' : 's') :
            r.counts.errors + ' row' + (r.counts.errors === 1 ? ' needs' : 's need') + ' fixing') + '</b><div class="small">' + r.counts.rows + ' rows checked · ' + r.counts.ok + ' OK · ' + r.counts.errors + ' with errors</div></div>' +
          (r.errors.length ? '<h2>Fix these rows, then check again</h2><div class="card" style="padding:4px 12px">' + r.errors.map(function (e) {
            return '<div class="att"><span class="chip" style="background:var(--bad-bg);color:var(--bad)">' + e.row + '</span><div class="grow small">' + esc(e.message) + '</div></div>';
          }).join('') + '</div><p class="muted small">Row numbers match your spreadsheet (row 1 is the header).</p>' : '') +
          (r.preview.length ? '<h2>' + (ok ? 'Will be added' : 'Rows that are OK') + '</h2><div class="card" style="padding:4px 12px">' + r.preview.map(function (x) {
            return '<div class="att"><span class="chip">' + x.row + '</span><div class="grow small"><b>' + esc(x.name) + '</b> · ' + esc(prettyPhone(x.phone)) + '<br><span class="muted">' +
              esc(kind === 'students' ? x.class + ', roll ' + x.roll + ' · parent ' + x.parentName + (x.parentExists ? ' (already registered)' : '') : x.subject + ' · ' + x.class) + '</span></div></div>';
          }).join('') + '</div>' : '') +
          (ok ? '<button class="primary block" id="icommit">Import ' + r.counts.ok + ' row' + (r.counts.ok === 1 ? '' : 's') + '</button>' : '');
        if ($('icommit')) $('icommit').onclick = function () {
          var b2 = this; b2.disabled = true; b2.textContent = 'Importing…';
          post('admin/imports/' + r.id + '/commit').then(function (res) {
            var c = res.created;
            $('ir').innerHTML = '<div class="card ok-card"><b>' + icon('check', 'sm') + ' Imported</b><div class="small">' +
              esc(Object.keys(c).map(function (k) { return c[k] + ' ' + (c[k] === 1 ? k.replace(/s$/, '') : k); }).join(', ')) + ' created. They can sign in with their numbers now.</div></div>';
            $('it').value = '';
          }, function (e) { b2.disabled = false; b2.textContent = 'Import'; toast(e.message); });
        };
      }, function (e) { btn.disabled = false; btn.textContent = 'Check file'; $('ir').innerHTML = '<div class="card alert-card small">' + esc(e.message) + '</div>'; });
    };
  };

  route();
})();
