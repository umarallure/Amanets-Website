/* /developers motion. Progressive: the page is complete without this file. With reduced motion we only
   position the track pill; nothing animates and nothing is hidden. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if (!reduce) root.classList.add('js-dev');

  /* A. Hero: once the panel has typed itself out, the track name keeps changing and the "✓" line re-confirms. */
  var word = document.querySelector('[data-cycle]');
  var okLine = document.getElementById('dev-ok');
  var hero = document.querySelector('.hero-stage');
  if (word && !reduce) {
    var names = ['backend', 'frontend', 'full-stack', 'ai & data', 'devops', 'mobile'], at = 0, busy = false, shown = true;
    if (hero && 'IntersectionObserver' in window) new IntersectionObserver(function (e) { shown = e[0].isIntersecting; }).observe(hero);
    var typeTo = function (text, done) {
      var s = word.textContent.replace(/"/g, '');
      (function erase() {
        if (s.length) { s = s.slice(0, -1); word.textContent = '"' + s + '"'; setTimeout(erase, 32); return; }
        var i = 0;
        (function write() {
          i++; word.textContent = '"' + text.slice(0, i) + '"';
          if (i < text.length) setTimeout(write, 55); else done();
        })();
      })();
    };
    var next = function () {
      if (busy || !shown || document.hidden) return;
      busy = true; at = (at + 1) % names.length;
      typeTo(names[at], function () {
        if (okLine) { okLine.classList.remove('flash'); void okLine.offsetWidth; okLine.classList.add('flash'); }
        busy = false;
      });
    };
    setTimeout(function () { setInterval(next, 3600); }, 6200); // after the typing intro (~4.5s) plus a beat
  }

  /* D. Tracks: a pill slides to the selected tab. */
  var tabs = document.querySelector('.dev-tabs');
  if (tabs) {
    var pill = document.createElement('span');
    pill.className = 'dev-pill'; pill.setAttribute('aria-hidden', 'true');
    tabs.insertBefore(pill, tabs.firstChild);
    var place = function () {
      var on = tabs.querySelector('[aria-selected="true"]');
      if (!on) return;
      pill.style.width = on.offsetWidth + 'px'; pill.style.height = on.offsetHeight + 'px';
      pill.style.borderRadius = getComputedStyle(on).borderRadius;
      pill.style.transform = 'translate(' + on.offsetLeft + 'px,' + on.offsetTop + 'px)';
    };
    root.classList.add('js-pill');
    place();
    new MutationObserver(place).observe(tabs, { attributes: true, subtree: true, attributeFilter: ['aria-selected'] });
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }

  /* E, F, H: start each animation when its block is on screen, once. */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('play'); io.unobserve(e.target); } });
    }, { threshold: .4 });
    document.querySelectorAll('.dev-chal, .dev-run, .ks-map').forEach(function (el) { io.observe(el); });
  } else {
    root.classList.remove('js-dev'); // no observer: show everything in its final state
  }
})();
