/* The brand intro plays on the first page view of a visit, which is what every QR scan is.
   Loaded without `defer` in <head> so the curtain is decided before the first paint (a deferred
   script would let the page flash first). Skipped for reduced motion and for the rest of the visit;
   a tap or key skips it. The animation itself is CSS (referral.css, "Brand intro"). */
(function () {
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || sessionStorage.getItem('amanet-intro')) return;
    sessionStorage.setItem('amanet-intro', '1');
  } catch (e) { return; }
  var root = document.documentElement;
  root.classList.add('intro');
  var skip = function () { root.classList.add('intro-skip'); };
  addEventListener('pointerdown', skip, { once: true });
  addEventListener('keydown', skip, { once: true });
})();
