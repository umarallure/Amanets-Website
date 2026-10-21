/* "Are you a fit?" checklist on /salesagent. The visitor ticks what applies; once every item is ticked a
   congratulations card with the Apply button appears. This is a self-check, not an approval: the application
   is still reviewed by the team. The count and the card text follow the page language. */
(function () {
  'use strict';
  var site = window.site;
  var section = document.getElementById('fit');
  if (!site || !section) return;
  var boxes = [].slice.call(section.querySelectorAll('input[type="checkbox"]'));
  var result = document.getElementById('fit-result');
  var hint = document.getElementById('fit-hint');
  var count = document.getElementById('fit-count');
  var bar = document.getElementById('fit-bar');

  function update() {
    var n = boxes.filter(function (box) { return box.checked; }).length;
    var all = n === boxes.length;
    count.textContent = site.t('sa.fitCount').replace('{n}', n).replace('{total}', boxes.length);
    bar.style.width = (n / boxes.length * 100) + '%';
    result.hidden = !all;
    hint.hidden = all;
    boxes.forEach(function (box) { box.closest('.fit-row').classList.toggle('on', box.checked); });
  }
  boxes.forEach(function (box) { box.addEventListener('change', update); });
  site.onLang(update);
  update();
})();
