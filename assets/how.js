/* "How to apply" scroll story. The active step is the last one whose top edge has passed the middle
   of the screen: it lights up, and the pinned counter and progress bar follow. This is a state
   change, not decoration, so it runs for everyone; the transitions are guarded in CSS for reduced
   motion. Checked on scroll (one animation frame at a time) and only while the section is near
   the screen. Without this script every step simply stays at full strength. */
(function () {
  'use strict';
  var section = document.querySelector('.how');
  var steps = [].slice.call(document.querySelectorAll('.how-step'));
  if (!section || !steps.length) return;

  var counter = document.getElementById('how-n');
  var bar = document.getElementById('how-bar');
  var current = -1;
  var ticking = false;

  function activate(index) {
    if (index === current) return;
    current = index;
    steps.forEach(function (step, i) {
      step.classList.toggle('is-active', i === index);
      step.classList.toggle('is-done', i < index);
    });
    if (counter) {
      counter.textContent = '0' + (index + 1);
      counter.style.animation = 'none'; // restart the small tick animation on each change
      void counter.offsetWidth;
      counter.style.animation = '';
    }
    if (bar) bar.style.width = ((index + 1) / steps.length * 100) + '%';
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var box = section.getBoundingClientRect();
    if (box.bottom < -200 || box.top > vh + 200) return;
    var middle = vh / 2;
    var index = 0;
    steps.forEach(function (step, i) {
      if (step.getBoundingClientRect().top <= middle) index = i;
    });
    activate(index);
  }

  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  section.classList.add('how-js');
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
  activate(Math.max(current, 0));
})();
