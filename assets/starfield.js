/* Starfield backdrop shared by every page: ~200 drifting, twinkling stars plus the odd
   shooting star. Halves its density on phones, pauses in background tabs, and draws one
   still frame under prefers-reduced-motion. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Starfield ──────────────────────────────────── */
  var canvas = document.getElementById('starfield');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var stars = [];
  var shooters = [];
  var w = 0, h = 0, dpr = 1;
  var lastW = 0, lastH = 0;

  function resize(reseed) {
    w = window.innerWidth;
    h = window.innerHeight;

    /* phones burn a lot of fill-rate at 3x for a field of 1px dots */
    var cap = w < 640 ? 1.5 : 2;
    dpr = Math.min(window.devicePixelRatio || 1, cap);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (reseed) seed();
  }

  function seed() {
    /* fewer stars on small screens — same visual density, less work */
    var max = w < 640 ? 110 : 220;
    var count = Math.round(Math.min(max, (w * h) / 7000));
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.25 + 0.25,
        a: Math.random() * 0.6 + 0.15,
        tw: Math.random() * 0.02 + 0.004,
        ph: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.045,
        vy: (Math.random() - 0.5) * 0.045,
        warm: Math.random() > 0.78
      });
    }
  }

  function spawnShooter() {
    var fromLeft = Math.random() > 0.5;
    shooters.push({
      x: fromLeft ? -60 : w + 60,
      y: Math.random() * h * 0.55,
      vx: (fromLeft ? 1 : -1) * (5.5 + Math.random() * 3),
      vy: 1.8 + Math.random() * 1.4,
      life: 1
    });
  }

  var t = 0;
  var raf = null;
  function frame() {
    t += 1;
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.ph += s.tw;
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < -2) s.x = w + 2; else if (s.x > w + 2) s.x = -2;
      if (s.y < -2) s.y = h + 2; else if (s.y > h + 2) s.y = -2;

      var alpha = s.a + Math.sin(s.ph) * 0.28;
      if (alpha < 0.03) alpha = 0.03;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.warm
        ? 'rgba(255,205,180,' + alpha.toFixed(3) + ')'
        : 'rgba(238,230,240,' + alpha.toFixed(3) + ')';
      ctx.fill();
    }

    /* occasional shooting star */
    if (!reduced && t % 60 === 0 && Math.random() < 0.22 && shooters.length < 2) spawnShooter();

    for (var j = shooters.length - 1; j >= 0; j--) {
      var sh = shooters[j];
      sh.x += sh.vx;
      sh.y += sh.vy;
      sh.life -= 0.006;

      var tailX = sh.x - sh.vx * 13;
      var tailY = sh.y - sh.vy * 13;
      var grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
      grad.addColorStop(0, 'rgba(255,215,195,' + Math.max(sh.life, 0).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(255,150,170,0)');

      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (sh.life <= 0 || sh.x < -160 || sh.x > w + 160 || sh.y > h + 160) shooters.splice(j, 1);
    }

    raf = requestAnimationFrame(frame);
  }

  /* Mobile browsers fire resize every time the address bar slides away.
     Always re-fit the canvas, but only re-scatter the stars on a real
     layout change — otherwise the sky visibly reshuffles while scrolling. */
  var resizeTimer = null;
  function onResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var widthChanged = window.innerWidth !== lastW;
      var bigHeightJump = Math.abs(window.innerHeight - lastH) > 140;
      resize(widthChanged || bigHeightJump);
      lastW = window.innerWidth;
      lastH = window.innerHeight;
      /* resizing clears the canvas, and with motion reduced nothing
         repaints it — so redraw the static sky by hand */
      if (reduced) drawStatic();
    }, 150);
  }

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  resize(true);
  lastW = window.innerWidth;
  lastH = window.innerHeight;

  /* don't animate against a backgrounded tab — pure battery drain */
  document.addEventListener('visibilitychange', function () {
    if (reduced) return;
    if (document.hidden) {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    } else if (!raf) {
      raf = requestAnimationFrame(frame);
    }
  });

  /* one static frame, no loop */
  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    for (var k = 0; k < stars.length; k++) {
      var st = stars[k];
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = st.warm
        ? 'rgba(255,205,180,' + st.a.toFixed(3) + ')'
        : 'rgba(238,230,240,' + st.a.toFixed(3) + ')';
      ctx.fill();
    }
  }

  if (reduced) {
    drawStatic();
  } else {
    raf = requestAnimationFrame(frame);
  }
})();
