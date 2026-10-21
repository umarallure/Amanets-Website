/* Scroll motion for the hero and the partner band. It only writes two CSS variables:
     --hp  how far the hero has scrolled away (0 to 1), set on .hero-stage
     --bp  how far the partner band has come into view (0 to 1), set on .partner-band
   Every visual effect lives in CSS and reads those variables. Transform and opacity only.
   Visitors who prefer reduced motion get none of it: this file exits before listening. */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var stage = document.querySelector('.hero-stage');
  var band = document.querySelector('.partner-band');
  if (!stage || !band) return;

  var ticking = false;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var s = stage.getBoundingClientRect();
    stage.style.setProperty('--hp', clamp(-s.top / Math.max(1, s.height)).toFixed(3));
    var b = band.getBoundingClientRect();
    band.style.setProperty('--bp', clamp((vh - b.top) / (vh * 0.55)).toFixed(3));
  }
  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
})();
