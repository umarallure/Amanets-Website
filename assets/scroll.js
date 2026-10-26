/* Scroll experience prototype. Plain JS, no libraries: a loader, a glyph-capsule wipe, a scrubbed capsule strip,
   a pinned card fan, parallax and reveals. Pattern inspired by KPR (Resn); all code and content here are original. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* A fixed set of per-column random numbers so the capsules look hand-set, not uniform. */
  var seeds = []; for (var s = 0; s < 80; s++) seeds.push((Math.sin(s * 91.7) * 43758.5453) % 1 * 0.5 + 0.5);

  /* Chess board elements: every transition is a field of alternating squares. */
  function cells(w, h, target) {
    var sq = Math.max(48 * dpr, Math.round(w / target)), cols = Math.ceil(w / sq), rows = Math.ceil(h / sq);
    return { sq: sq, cols: cols, rows: rows };
  }
  function square(ctx, x, y, sq, a) { // a: 0..1 scale from the square's centre; slight overdraw avoids hairline gaps
    if (a <= 0.003) return;
    var d = sq * a + (a >= 1 ? 1 : 0);
    ctx.fillRect(x + (sq - d) / 2, y + (sq - d) / 2, d, d);
  }
  function capsule(ctx, x, y, w, h) {
    var r = Math.min(w / 2, h / 2);
    if (h <= 0.5) return;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    ctx.fill();
  }

  /* ── Loader → wipe → reveal ───────────────────────────────────── */
  var loader = $('loader'), wipe = $('wipe');
  var entered = false;
  function reveal() { root.classList.add('go-in'); document.body.classList.add('is-in'); }

  if (!loader || reduce) {
    if (loader) loader.remove(); if (wipe) wipe.remove();
    reveal();
  } else {
    var fill = $('loader-fill'), pct = $('loader-pct'), enter = $('loader-enter'), label = $('loader-label');
    document.body.style.overflow = 'hidden';
    var hero = new Image(); hero.src = '/assets/img/valley-1600.jpg';
    var t0 = performance.now(), imgDone = hero.complete, shown = 0;
    hero.onload = hero.onerror = function () { imgDone = true; };
    var labels = ['LOADING PEOPLE', 'LOADING PLACES', 'LOADING POSSIBILITY'];
    (function tick(now) {
      var target = clamp((now - t0) / 1600, 0, 1) * (imgDone ? 1 : 0.9);
      shown += (target - shown) * 0.12;
      var p = Math.min(100, Math.round(shown * 100 + (imgDone && target >= 1 ? 1 : 0)));
      fill.style.width = p + '%'; pct.textContent = p + '%';
      label.textContent = labels[Math.min(2, Math.floor(p / 34))];
      if (p >= 100) {
        loader.classList.add('ready');
        setTimeout(go, 900);
        return;
      }
      requestAnimationFrame(tick);
    })(t0);
    enter.addEventListener('click', go);

    function go() {
      if (entered) return; entered = true;
      var ctx = wipe.getContext('2d');
      var w = wipe.width = innerWidth * dpr, h = wipe.height = innerHeight * dpr;
      var g = cells(w, h, 12), start = performance.now(), DUR = 1700, swapped = false;
      (function step(now) {
        var t = clamp((now - start) / DUR, 0, 1);
        ctx.clearRect(0, 0, w, h);
        for (var cy = 0; cy < g.rows; cy++) for (var cx = 0; cx < g.cols; cx++) {
          var d = (cx + cy) / (g.cols + g.rows - 2);
          var u = clamp((t - d * 0.38 - seeds[(cx * 7 + cy * 3) % 80] * 0.08) / 0.5, 0, 1);
          var a = u < 0.5 ? ease(u * 2) : ease((1 - u) * 2);
          ctx.fillStyle = (cx + cy) % 2 ? '#f4f1ea' : '#16161a';
          square(ctx, cx * g.sq, cy * g.sq, g.sq, a);
        }
        if (t >= 0.5 && !swapped) {
          swapped = true; loader.remove(); document.body.style.overflow = ''; reveal();
        }
        if (t < 1) requestAnimationFrame(step); else wipe.remove();
      })(start);
    }
  }

  /* ── Scrubbed capsule strip: red capsules rise until the next section is solid ── */
  var strip = $('strip'), sc = $('strip-c');
  var sctx = sc && sc.getContext('2d');
  function drawStrip() {
    if (!sctx) return;
    var r = strip.getBoundingClientRect(), vh = innerHeight;
    var p = clamp(-r.top / (r.height - vh), 0, 1);
    var w = sc.width = innerWidth * dpr, h = sc.height = vh * dpr;
    sctx.clearRect(0, 0, w, h);
    var g = cells(w, h, 12);
    if (p >= 0.995) { sctx.fillStyle = '#d71920'; sctx.fillRect(0, 0, w, h); return; }
    for (var cy = 0; cy < g.rows; cy++) for (var cx = 0; cx < g.cols; cx++) {
      var fromBottom = (g.rows - 1 - cy) / Math.max(1, g.rows - 1);
      var u = clamp((p * 1.5 - fromBottom * 0.5 - seeds[(cx * 5 + cy * 11) % 80] * 0.12) / 0.5, 0, 1);
      sctx.fillStyle = (cx + cy) % 2 ? '#d71920' : '#8f0f15';
      square(sctx, cx * g.sq, cy * g.sq, g.sq, ease(u));
    }
  }

  /* ── Pinned card fan ──────────────────────────────────────────── */
  var doors = $('doors'), fan = $('fan');
  var cards = fan ? Array.prototype.slice.call(fan.children) : [];
  function drawFan() {
    if (!doors || !fan || reduce) return;
    var r = doors.getBoundingClientRect(), vh = innerHeight, vw = innerWidth;
    var p = clamp(-r.top / (r.height - vh), 0, 1);
    var total = fan.scrollWidth, pad = vw < 900 ? 28 : 92;
    var x = pad + (vw * 0.5 - total * 0.5 - pad) * 0 + (vw - pad * 1.2 - total) * p;
    fan.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    cards.forEach(function (li) {
      var b = li.getBoundingClientRect(), d = Math.abs((b.left + b.width / 2) - vw / 2) / vw;
      var sc2 = 1 - clamp(d * 0.34, 0, 0.2);
      li.style.transform = 'translateY(' + (d * 46).toFixed(1) + 'px) scale(' + sc2.toFixed(3) + ')';
    });
  }

  /* ── Hero parallax, crosshair, page number, nav ───────────────── */
  var hch = $('hero-checker'), heroImg = $('hero-img'), cross = $('cross'), pageNo = $('page-no');
  var sections = ['hero', 'why', 'doors', 'next'].map(function (id) { return { id: id, el: $(id) }; });
  var links = document.querySelectorAll('#nav a');
  function onScroll() {
    var y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    if (heroImg && y < vh * 1.2) heroImg.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0) scale(' + (1 + y / vh * 0.06).toFixed(3) + ')';
    if (cross) cross.style.transform = 'translate3d(0,' + (60 + (vh - 150) * (max > 0 ? y / max : 0)).toFixed(1) + 'px,0)';
    var cur = 'hero';
    sections.forEach(function (s) { if (s.el && s.el.getBoundingClientRect().top < vh * 0.5) cur = s.id; });
    links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-s') === cur); });
    if (pageNo) var mv = sections.map(function (s) { return s.id; }).indexOf(cur); pageNo.textContent = 'MOVE 0' + (mv + 1) + ' · ' + ['E4', 'NF3', 'BC4', 'O-O'][mv];
    if (hch && y < vh * 1.4) hch.style.transform = 'translate3d(' + (-y * 0.12).toFixed(1) + 'px,' + (y * 0.1).toFixed(1) + 'px,0)';
    drawStrip(); drawFan();
  }
  var queued = false;
  function queue() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; onScroll(); }); }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  onScroll();

  /* ── HUD coordinates (A–H along the bottom, 1–8 down the side) ── */
  var files = $('files'), ranks = $('ranks');
  if (files) 'ABCDEFGH'.split('').forEach(function (c) { var e = document.createElement('i'); e.style.fontStyle = 'normal'; e.textContent = c; files.appendChild(e); });
  if (ranks) for (var rk = 8; rk >= 1; rk--) { var re = document.createElement('i'); re.style.fontStyle = 'normal'; re.textContent = rk; ranks.appendChild(re); }

  /* ── Photos are uncovered square by square as they enter view ── */
  function checkerReveal(el, color) {
    if (reduce || !el) return;
    var cv = document.createElement('canvas'); cv.className = 'reveal-checker'; cv.setAttribute('aria-hidden', 'true');
    el.appendChild(cv);
    var run = function () {
      var w = cv.width = el.clientWidth * dpr, h = cv.height = el.clientHeight * dpr, ctx = cv.getContext('2d');
      var g = cells(w, h, 8), t0 = performance.now();
      (function step(now) {
        var t = clamp((now - t0) / 1400, 0, 1);
        ctx.clearRect(0, 0, w, h);
        for (var cy = 0; cy < g.rows; cy++) for (var cx = 0; cx < g.cols; cx++) {
          var d = (cx + cy) / (g.cols + g.rows - 2);
          var u = clamp((t - d * 0.45 - seeds[(cx * 3 + cy * 13) % 80] * 0.1) / 0.45, 0, 1);
          ctx.fillStyle = (cx + cy) % 2 ? color[0] : color[1];
          square(ctx, cx * g.sq, cy * g.sq, g.sq, 1 - ease(u));
        }
        if (t < 1) requestAnimationFrame(step); else cv.remove();
      })(t0);
    };
    if ('IntersectionObserver' in window) {
      var ob = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { ob.disconnect(); run(); } }, { threshold: 0.3 });
      ob.observe(el);
    } else cv.remove();
  }
  document.querySelectorAll('.why-card').forEach(function (n) { checkerReveal(n, ['#0b0b0b', '#d71920']); });
  checkerReveal(document.querySelector('.next-img'), ['#0b0b0b', '#2a2a2e']);

  /* ── Reveals ──────────────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.18 });
    document.querySelectorAll('[data-in]').forEach(function (n) { io.observe(n); });
  } else document.querySelectorAll('[data-in]').forEach(function (n) { n.classList.add('in'); });
})();
