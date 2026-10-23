/* Locations globe: a dotted Earth (real coastlines, 2° grid from Natural Earth 110m) that turns to the
   office the visitor is looking at, with an arc between Kosovo and Mérida. Canvas only, no libraries.
   Reduced motion: one still frame, no rotation; choosing a location just redraws it. */
(function () {
  'use strict';
  var canvas = document.getElementById('globe');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var LAND = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf4AP/gAAAAAAAAAAAAAAAAAAAAAAAX/z///+AAAAAAAABAAAAAAAAAAAAAYd8P///wAA+AAAAAA8AAAAAAAAAAAwAnw////4AAIAAAAAAGAAAAAAAAAAADivwAf//wAAAAADAAf/wAHYAAAAAADoi3sAP//gAAAAAMAD///sAAAAgBgACfwz/AD/+gAAA4AEHf///+/8gBAP/7/nJdjwD/+AAAH/AA7f///////f4P//////h8H/gAAAf/6//f////////Mf/////9H4D8AeAA+ev///////////AP/////4A0B4AAAD5/////////////Af3////gHgA4AAAH5///////////LwAHgH///gHkAAAAAH4/////////+CIAABAB///4D+AAAAGCx/////////4A8AAIAAf///n/gAAAOCD/////////wA4AAAAAf///n/wAAAbP///////////AgAAAAAP/////wAAADf//////////9AAAAAAAF////0YAAAB///////////9AAAAAAAD////8EAAAB///////////5AAAAAAAD////2AAAAB/f5fP//////wAAAAAAAD////gAAAAfxnwPP//////jAAAAAAAD////AAAAAPCb3/n/////+CAAAAAAAD///8AAAAAfALf/n////+ECAAAAAAAB///8AAAAAGHQP/n/////mMAAAAAAAA///8AAAAAH+Ai///////E8AAAAAAAAf//wAAAAAP/AA///////BgAAAAAAAAP//gAAAAAf/73///////gAAAAAAAAAD/AQAAAAAf////f/////gAAAAAAAAAF+AQAAAAB///+/n/////AAAAAAAAAAC+AAAAAAB///+f0H////AAAAAAAAAAAeAwAAAAD////f/B///8gAAAAAAAAAAeGEAAAAH////v+B/z/AAAAAAAAAAAAPMAgAAAD////n+A/B+gAAAAAAAAAAAD8AAAAAD////n4AeB/AgAAAAAAAAAAAPAAAAAH////3gAcAfAgAAAAAAAAAAADAAAAAD////6AAcAfggAAAAAAAAAAABDwAAAD////8wAMATAIAAAAAAAAAAAAr/AAAB/////gAKASAAAAAAAAAAAAAAH/gAAA/////gACAAAIAAAAAAAAAAAAH/8AAAaH///AAAAsGAAAAAAAAAAAAAH/+AAAAB//+AAAAUOAAAAAAAAAAAAAP/+AAAAB//8AAAAYegAAAAAAAAAAAAP//gAAAD//4AAAAMeBgAAAAAAAAAAAP//8AAAB//wAAAAGdiuAAAAAAAAAAAf///AAAA//wAAAACAQHgAAAAAAAAAAP///gAAA//wAAAABwAHwgAAAAAAAAAH///AAAA//wAAAAACIDQIAAAAAAAAAH//+AAAAf/wAAAAAAAAAAAAAAAAAAAD//+AAAA//wgAAAAABxAAAAAAAAAAAD//+AAAA//wgAAAAAPxgBAAAAAAAAAA//8AAAA//jgAAAAAf5gAAAAAAAAAAAf/8AAAA//DgAAAAAf/gAAAAAAAAAAAf/8AAAAf/DAAAAAD//4CAAAAAAAAAAf/wAAAAf/DAAAAAH//4AAAAAAAAAAAf/AAAAAf+CAAAAAH//8AAAAAAAAAAAf/AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAH4AAAAAAD//+AAAAAAAAAAA/8AAAAAHwAAAAAADwf8AAAAAAAAAAA/gAAAAAAAAAAAAACAH4AIAAAAAAAAB/wAAAAAAAAAAAAAAAD4AEAAAAAAAAB+AAAAAAAAAAAAAAAAAAAGAAAAAAAAB6AAAAAAAAAAAAAAAAAwAMAAAAAAAAA8AAAAAAAAAAAAAAAAAQAYAAAAAAAAB4AAAAAAAAAAAAAAAAAAAwAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAACAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAeAAIP+f/gAAAAAAAAAAAMAAAAAAABP/+H//////AAAAAAAAAAA+AAAAAf////8////////AAAAAAAOEAPAAAB///////////////gAAAP//T//8AAAH//////////////+AAAH/////4AAAH///////////////8AAE//////4ABw////////////////8AAAD//////gCA////////////////wAAAf/////////////////////////+A/4A///////////////////////////////////////////////////////////////////////////////////////";
  var GW = 180, GH = 90;
  var bytes = atob(LAND), dots = [];
  for (var i = 0; i < GW * GH; i++) {
    if ((bytes.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1) {
      var x = i % GW, y = (i / GW) | 0;
      // thin the rows toward the poles so the dots are evenly spread over the sphere
      var k = Math.max(1, Math.round(1 / Math.cos((90 - (y + .5) * 2) * Math.PI / 180)));
      if (x % k) continue;
      dots.push([(90 - (y + .5) * 2) * Math.PI / 180, (-180 + (x + .5) * 2) * Math.PI / 180]); // [lat, lon] radians
    }
  }
  var RAD = Math.PI / 180;
  var PLACES = [
    { key: 'ks', name: 'Kosovo', lat: 42.66 * RAD, lon: 21.17 * RAD },
    { key: 've', name: 'Mérida', lat: 8.59 * RAD, lon: -71.14 * RAD }
  ];
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = document.querySelectorAll('[data-place]');

  var active = 0, lon0 = PLACES[0].lon, lat0 = PLACES[0].lat * .6, hold = 0, last = 0, w = 0, h = 0, dpr = 1, visible = true;

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // orthographic projection centred on (lon0, lat0); returns [x, y, depth] with depth > 0 on the near side
  function project(lat, lon, R, cx, cy) {
    var dl = lon - lon0, cl = Math.cos(lat);
    var x = cl * Math.sin(dl);
    var y = Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * cl * Math.cos(dl);
    var z = Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * cl * Math.cos(dl);
    return [cx + x * R, cy - y * R, z];
  }
  function vec(lat, lon) { return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]; }

  function draw(t) {
    var R = Math.min(w, h) * .46, cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    // sphere body
    var g = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R);
    g.addColorStop(0, '#1a1a1a'); g.addColorStop(1, '#0b0b0b');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();
    // land dots, dimmer toward the limb
    var r = Math.max(1, R / 150);
    for (var i = 0; i < dots.length; i++) {
      var p = project(dots[i][0], dots[i][1], R, cx, cy);
      if (p[2] <= 0) continue;
      ctx.globalAlpha = .14 + .5 * Math.pow(p[2], .7);
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    // arc between the offices, lifted off the surface
    var a = vec(PLACES[0].lat, PLACES[0].lon), b = vec(PLACES[1].lat, PLACES[1].lon);
    var om = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    var N = 64, prev = null;
    ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (var s = 0; s <= N; s++) {
      var f = s / N, k1 = Math.sin((1 - f) * om) / Math.sin(om), k2 = Math.sin(f * om) / Math.sin(om);
      var v = [k1 * a[0] + k2 * b[0], k1 * a[1] + k2 * b[1], k1 * a[2] + k2 * b[2]];
      var lift = 1 + .22 * Math.sin(f * Math.PI), len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      var lat = Math.asin(v[2] / len), lon = Math.atan2(v[1], v[0]);
      var dl = lon - lon0, cl = Math.cos(lat);
      var px = cl * Math.sin(dl) * lift, py = (Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * cl * Math.cos(dl)) * lift;
      var pz = (Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * cl * Math.cos(dl)) * lift;
      var onSphere = pz > 0 || px * px + py * py > 1; // hidden only when behind the disc
      var cur = onSphere ? [cx + px * R, cy - py * R] : null;
      if (cur && prev) {
        var fade = still ? 1 : .55 + .45 * Math.sin(f * 14 - t / 260);
        ctx.strokeStyle = 'rgba(237,28,36,' + (.85 * fade).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
      }
      prev = cur;
    }
    // markers + labels
    ctx.font = '600 ' + Math.max(12, R / 17).toFixed(1) + 'px "Space Grotesk", system-ui, sans-serif'; ctx.textBaseline = 'middle';
    PLACES.forEach(function (pl, idx) {
      var p = project(pl.lat, pl.lon, R, cx, cy);
      if (p[2] <= .02) return;
      var on = idx === active, pulse = still ? .5 : (t / 1400 + idx * .5) % 1;
      ctx.beginPath(); ctx.arc(p[0], p[1], R / 38 + pulse * R / 9, 0, 6.2832);
      ctx.strokeStyle = 'rgba(237,28,36,' + ((1 - pulse) * (on ? .8 : .4)).toFixed(3) + ')'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(p[0], p[1], R / 48 + (on ? 1.5 : 0), 0, 6.2832); ctx.fillStyle = '#ed1c24'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = on ? '#fff' : 'rgba(255,255,255,.7)'; ctx.textAlign = p[0] > cx ? 'left' : 'right';
      ctx.fillText(pl.name, p[0] + (p[0] > cx ? 1 : -1) * (R / 24 + 8), p[1] - 1);
    });
  }

  function setActive(i, user) {
    active = i; hold = user ? 14000 : 0;
    cards.forEach(function (c) { c.classList.toggle('is-on', +c.getAttribute('data-place') === i); });
    if (still) { lon0 = PLACES[i].lon; lat0 = PLACES[i].lat * .6; draw(0); }
  }

  function frame(now) {
    var dt = Math.min(48, now - (last || now)); last = now;
    if (visible) {
      var tl = PLACES[active].lon, d = tl - lon0;
      d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest way round
      lon0 += d * (1 - Math.exp(-dt / 380));
      lat0 += (PLACES[active].lat * .6 - lat0) * (1 - Math.exp(-dt / 380));
      if (Math.abs(d) < .02) lon0 += dt * .00004; // a slow drift once settled
      if (hold > 0) hold -= dt;
      draw(now);
    }
    requestAnimationFrame(frame);
  }

  // auto-cycle between the offices unless the visitor has chosen one
  var timer = 0;
  function cycle() { if (hold <= 0) setActive(1 - active, false); }
  cards.forEach(function (c) {
    var i = +c.getAttribute('data-place');
    c.addEventListener('mouseenter', function () { setActive(i, true); });
    c.addEventListener('focusin', function () { setActive(i, true); });
    c.addEventListener('click', function () { setActive(i, true); });
  });

  // local clocks
  function clocks() {
    var lang = document.documentElement.lang === 'es' ? 'es' : 'en-GB';
    document.querySelectorAll('[data-tz]').forEach(function (el) {
      try { el.textContent = new Intl.DateTimeFormat(lang, { timeZone: el.getAttribute('data-tz'), hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); } catch (e) {}
    });
  }
  clocks(); setInterval(clocks, 30000);

  resize();
  window.addEventListener('resize', function () { resize(); if (still) draw(0); });
  setActive(0, false);
  if (still) { draw(0); return; }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
  document.addEventListener('visibilitychange', function () { if (document.hidden) visible = false; });
  timer = setInterval(cycle, 6500);
  requestAnimationFrame(frame);
})();
