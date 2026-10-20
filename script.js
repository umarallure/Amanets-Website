/* ══════════════════════════════════════════════════════
   Amanets — Coming Soon · interactions
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Year ───────────────────────────────────────── */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Stagger the headline letters ───────────────── */
  var letters = document.querySelectorAll('#title span span');
  Array.prototype.forEach.call(letters, function (el, i) {
    el.style.animationDelay = (0.45 + i * 0.06) + 's';
  });

  /* ── Count the progress % up in step with the bar ─ */
  var pct = document.getElementById('pct');
  var TARGET = 68;
  if (pct) {
    if (reduced) {
      pct.textContent = TARGET + '%';
    } else {
      var start = null;
      var DELAY = 1400;   // matches .fill animation-delay
      var DUR = 2400;     // matches .fill animation-duration
      var tick = function (ts) {
        if (start === null) start = ts;
        var t = (ts - start - DELAY) / DUR;
        if (t < 0) { requestAnimationFrame(tick); return; }
        if (t > 1) t = 1;
        // ease-out to mirror the CSS curve closely enough
        var eased = 1 - Math.pow(1 - t, 3);
        pct.textContent = Math.round(eased * TARGET) + '%';
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ── Pointer parallax on the eclipse ────────────── */
  var eclipse = document.getElementById('eclipse');
  if (eclipse && !reduced && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 … 1
      var y = (e.clientY / window.innerHeight - 0.5) * 2;
      eclipse.style.setProperty('--px', (x * 16).toFixed(1) + 'px');
      eclipse.style.setProperty('--py', (y * 16).toFixed(1) + 'px');
    }, { passive: true });
  }

  /* ── Signup form ────────────────────────────────── */
  var form = document.getElementById('signup');
  var note = document.getElementById('note');
  var email = document.getElementById('email');

  function say(msg, kind) {
    if (!note) return;
    note.textContent = msg;
    note.className = 'note show ' + (kind || '');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = (email.value || '').trim();

      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
        say('That email doesn’t look right — mind checking it?', 'err');
        email.focus();
        return;
      }

      var btn = form.querySelector('.btn');
      var label = form.querySelector('.btn-label');
      btn.disabled = true;
      label.textContent = 'Sending…';

      /* No backend yet — swap this block for a real POST when
         the list provider is picked (e.g. fetch('/api/subscribe', …)). */
      window.setTimeout(function () {
        label.textContent = 'You’re on the list';
        say('Thanks — we’ll email ' + value + ' the moment we launch.', 'ok');
        form.reset();
      }, 750);
    });

    email.addEventListener('input', function () {
      if (note && note.classList.contains('err')) note.className = 'note';
    });
  }

})();
