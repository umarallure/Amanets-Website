/* "Are you a fit?" checklist on /salesagent. The visitor ticks what applies. Living in Puerto Rico is the first item
   and is required; with it plus at least two more (3 of 4) the options fold away and a congratulations card with the
   Apply button appears. This is a self-check, not an approval: the application is still reviewed by the team.
   A short pause before folding lets the visitor see their last tick land. "Review my answers" brings the list back. */
(function () {
  'use strict';
  var site = window.site;
  var section = document.getElementById('fit');
  if (!site || !section) return;
  var MIN = 3; // residency (the first item) plus at least two more
  var body = section.querySelector('.sa-fit-body');
  var boxes = [].slice.call(section.querySelectorAll('input[type="checkbox"]'));
  var result = document.getElementById('fit-result');
  var hint = document.getElementById('fit-hint');
  var count = document.getElementById('fit-count');
  var bar = document.getElementById('fit-bar');
  var edit = document.getElementById('fit-edit');
  var timer = 0;
  var reviewing = false;

  function ticked() { return boxes.filter(function (box) { return box.checked; }).length; }
  function qualifies() { return boxes[0].checked && ticked() >= MIN; }

  // Instant feedback: the rows, the count and the bar follow every tick.
  function paint() {
    var n = ticked();
    count.textContent = site.t('sa.fitCount').replace('{n}', n).replace('{total}', boxes.length);
    bar.style.width = (n / boxes.length * 100) + '%';
    boxes.forEach(function (box) { box.closest('.fit-row').classList.toggle('on', box.checked); });
  }
  // The fold: hide the options and show the card, or the reverse.
  function settle() {
    var ok = qualifies() && !reviewing;
    body.classList.toggle('qualified', ok);
    result.hidden = !ok;
    hint.hidden = ok;
    boxes.forEach(function (box) { box.tabIndex = ok ? -1 : 0; });
  }

  boxes.forEach(function (box) {
    box.addEventListener('change', function () {
      reviewing = false;
      paint();
      clearTimeout(timer);
      timer = setTimeout(settle, 650);
    });
  });
  edit.addEventListener('click', function () {
    reviewing = true;
    settle();
    boxes[0].focus();
  });
  site.onLang(function () { paint(); });
  paint();
  settle();
})();
