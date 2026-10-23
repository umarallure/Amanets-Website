/* Company pages: EN/ES copy, language toggle (shares the 'amanets-lang' key with the hiring pages),
   header menu and scroll reveal. No dependencies. */
(function () {
  'use strict';

  // Referral links and QR codes issued before the move point at /?ref=… — send them to the Mérida page.
  if (location.pathname === '/' && /[?&](ref|src)=/.test(location.search)) { location.replace('/merida' + location.search + location.hash); return; }

  var es = {
    'nav.skip': 'Saltar al contenido', 'nav.home': 'Inicio', 'nav.team': 'Nuestro equipo', 'nav.locations': 'Ubicaciones', 'nav.contact': 'Contacto',
    'nav.careers': 'Carreras', 'nav.merida': 'Empleos en Mérida', 'nav.pr': 'Agentes en Puerto Rico', 'nav.dev': 'Desarrolladores', 'nav.partners': 'Socios de referidos',
    'cta.apply': 'Postularme',
    'hero.h1a': 'Encuentra tu', 'hero.h1b': 'lugar.', 'hero.m1': '3 países', 'hero.m2': 'Una empresa de EE. UU.',
    'hero.lede': 'Trabaja con una empresa de Estados Unidos desde Kosovo, Venezuela o Puerto Rico. Trabajo real, capacitación real y espacio para crecer.',
    'hero.cta1': 'Ver puestos abiertos', 'hero.cta2': 'Recomendar a alguien',
    'why.kicker': 'Por qué Amanet', 'why.title': 'Una empresa hecha para las personas.',
    'why.a': 'Una empresa de EE. UU.', 'why.ab': 'Trabaja para clientes en Estados Unidos sin salir de casa.',
    'why.b': 'Horarios que se adaptan a ti', 'why.bb': 'Puestos de medio tiempo y tiempo completo, flexibles para estudiantes.',
    'why.c': 'Crece con nosotros', 'why.cb': 'Capacitación desde el primer día y espacio para ascender.',
    'opp.kicker': 'Oportunidades abiertas', 'opp.title': 'Elige la puerta que va contigo.',
    'opp.a': 'Empleos en Mérida', 'opp.ab': 'Puestos de ventas, soporte y administración en nuestra oficina de Rodero Plaza. Pago en dólares.', 'opp.acta': 'Ver puestos',
    'opp.d': 'Agentes de ventas en Puerto Rico', 'opp.db': 'Vende desde la isla a clientes de todo EE. UU. Bilingüe y listo para empezar.', 'opp.dcta': 'Ver puestos',
    'opp.b': 'Desarrolladores en Kosovo', 'opp.bb': 'Tu código es tu CV. Resuelve un reto real y conoce a nuestros ingenieros.', 'opp.bcta': 'Comenzar el proceso',
    'opp.ctag': 'Referidos', 'opp.c': 'Socios de referidos', 'opp.cb': '¿Conoces a alguien excelente? Comparte tu enlace y sigue su progreso.', 'opp.ccta': 'Ser socio',
    'how.kicker': 'Cómo postularte', 'how.title': 'Tres pasos. Sin CV obligatorio.',
    'how.a': 'Elige un puesto', 'how.ab': '¿No sabes cuál? Postúlate igual y te ayudamos.',
    'how.b': 'Envía tu solicitud', 'how.bb': 'Toma unos minutos. El CV es opcional.',
    'how.c': 'Te contactamos', 'how.cb': 'Leemos cada solicitud y te respondemos.',
    'close.h': 'El siguiente paso es tuyo.', 'close.cta': 'Postularme ahora',
    'team.kicker': 'Nuestro equipo', 'team.title': 'Las personas primero, siempre.', 'team.lead': 'Amanet es una empresa de EE. UU. que contrata y capacita a personas con talento en Kosovo, Mérida y Puerto Rico, y las pone a trabajar para clientes en todo Estados Unidos.',
    'team.mk': 'Misión', 'team.m': 'Abrir oportunidades.', 'team.mb': 'Encontramos personas con talento donde estén y les damos lo necesario para que tengan éxito.',
    'team.mc1': 'Trabajo', 'team.mc2': 'Capacitación', 'team.mc3': 'Apoyo',
    'team.vk': 'Visión', 'team.v': 'Dar el primer paso.', 'team.vb': 'Un equipo formado por los mejores: profesionales capaces y confiables de todo el mundo.',
    'team.vc1': 'Capaces', 'team.vc2': 'Confiables', 'team.vc3': 'Sin fronteras',
    'team.ck': 'Cultura', 'team.c1': 'Personas primero', 'team.c1b': 'Leemos cada solicitud y te respondemos.',
    'team.c2': 'Estudia y trabaja', 'team.c2b': 'Horarios de medio tiempo y tiempo completo que respetan tus clases.',
    'team.c3': 'Crecemos juntos', 'team.c3b': 'Trabajo real desde el primer día y habilidades por encima del currículum.',
    'loc.kicker': 'Ubicaciones', 'loc.title': 'Dos oficinas. Un equipo.', 'loc.lead': 'Atendemos a clientes de EE. UU. desde ambos lugares, así que siempre hay alguien trabajando en horario estadounidense.',
    'loc.globe': 'Un globo terráqueo con Kosovo y Mérida marcados y un arco entre ambos.',
    'loc.a': 'Equipo de software', 'loc.ab': 'Ingenieros que crean y entregan para clientes de EE. UU. Contratación por retos reales, revisada por ingenieros.',
    'loc.b': 'Oficina de ventas y soporte', 'loc.bb': 'Rodero Plaza, cerca de la universidad y del centro. Puestos de ventas, soporte y administración.',
    'loc.time': 'Hora local', 'loc.cta': 'Puestos abiertos aquí',
    'contact.kicker': 'Contacto', 'contact.title': '¿Cómo podemos ayudarte?', 'contact.lead': 'Elige el tema que corresponda y te llevamos al lugar correcto.',
    'contact.a': 'Pregunta sobre empleos', 'contact.ab': 'Puestos, pago, horarios y cómo funciona postularse.',
    'contact.b': 'Socios de referidos', 'contact.bb': 'Crea tu enlace y sigue tus referidos.',
    'contact.c': 'Desarrolladores', 'contact.cb': 'Comienza el proceso por retos.',
    'contact.d': 'Universidades y negocios', 'contact.db': 'Alianzas y consultas comerciales. Nuestro correo y formulario llegan pronto.',
    'privacy.kicker': 'Legal', 'privacy.title': 'Aviso de privacidad', 'privacy.lead': 'Cómo usa Amanet la información que envías al postularte o registrarte como socio de referidos.',
    'privacy.l1': 'Uso', 'privacy.l2': 'Acceso', 'privacy.l3': 'Tu socio',
    'privacy.p1': 'Usamos tu información solo para revisar tu solicitud o gestionar tu cuenta de socio.',
    'privacy.p2': 'El equipo de selección autorizado puede ver tu solicitud.',
    'privacy.p3': 'Si llegaste por el enlace de un socio, esa persona solo ve tu nombre, el puesto al que te postulaste y la etapa de tu proceso.',
    'privacy.back': 'Volver al inicio',
    'foot.privacy': 'Aviso de privacidad'
  };
  var en = {}, enAria = {};
  document.querySelectorAll('[data-i18n]').forEach(function (el) { en[el.getAttribute('data-i18n')] = en[el.getAttribute('data-i18n')] || el.textContent; });

  document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { enAria[el.getAttribute('data-i18n-aria')] = el.getAttribute('aria-label'); });

  function pick() {
    var forced = new URLSearchParams(location.search).get('lang');
    try {
      if (forced === 'en' || forced === 'es') { localStorage.setItem('amanets-lang', forced); return forced; }
      var saved = localStorage.getItem('amanets-lang');
      if (saved === 'en' || saved === 'es') return saved;
    } catch (e) {}
    return /^es\b/i.test(navigator.language || '') ? 'es' : 'en';
  }

  function apply(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      el.textContent = lang === 'es' && es[k] ? es[k] : en[k];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { var k = el.getAttribute('data-i18n-aria'); el.setAttribute('aria-label', lang === 'es' && es[k] ? es[k] : enAria[k]); });
    document.querySelectorAll('.lang-switch [data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
  }

  var lang = pick();
  apply(lang);
  document.querySelectorAll('.lang-switch [data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem('amanets-lang', lang); } catch (e) {}
      apply(lang);
    });
  });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header menu
  var burger = document.querySelector('.hburger'), nav = document.getElementById('hnav');
  var dropBtn = document.querySelector('.hdrop-btn');
  if (burger && nav) burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', String(open));
  });
  // In the phone menu "Careers" is only a label for the links under it, so keep it out of the tab order.
  if (dropBtn) {
    var mq = matchMedia('(max-width: 1059px)');
    var label = function () { if (mq.matches) { dropBtn.setAttribute('tabindex', '-1'); dropBtn.setAttribute('aria-hidden', 'true'); } else { dropBtn.removeAttribute('tabindex'); dropBtn.removeAttribute('aria-hidden'); } };
    label(); (mq.addEventListener ? mq.addEventListener('change', label) : mq.addListener(label));
  }
  if (dropBtn) {
    dropBtn.addEventListener('click', function () { dropBtn.setAttribute('aria-expanded', String(dropBtn.getAttribute('aria-expanded') !== 'true')); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.hdrop')) dropBtn.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { dropBtn.setAttribute('aria-expanded', 'false'); if (nav) nav.classList.remove('open'); if (burger) burger.setAttribute('aria-expanded', 'false'); } });
  }
  // Section links scroll in place; close the phone menu after a tap and light the section in view.
  if (nav) nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { nav.classList.remove('open'); if (burger) burger.setAttribute('aria-expanded', 'false'); }
  });
  var links = {};
  document.querySelectorAll('.hnav a[href^="#"], .hnav a[href="/"]').forEach(function (a) { links[a.getAttribute('href').replace(/^\//, '#top')] = a; });
  function mark(id) { Object.keys(links).forEach(function (k) { if (k === '#' + id) links[k].setAttribute('aria-current', 'true'); else links[k].removeAttribute('aria-current'); }); }
  if ('IntersectionObserver' in window && document.getElementById('team')) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['team', 'locations', 'contact'].forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
    window.addEventListener('scroll', function () { if (window.scrollY < 200) mark('top'); }, { passive: true });
    mark('top');
  }

  // Hero mosaic: each tile cross-fades through its photos, the two tiles offset so they never change together.
  var tiles = document.querySelectorAll('.home-mosaic [data-slides]');
  if (tiles.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-mosaic');
    var onScreen = true;
    var heroEl = document.querySelector('.home-stage');
    if ('IntersectionObserver' in window && heroEl) new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; }).observe(heroEl);
    tiles.forEach(function (tile) {
      var slides = tile.querySelectorAll('.mo-slide'), i = 0;
      if (slides.length < 2) return;
      setTimeout(function () {
        setInterval(function () {
          if (!onScreen || document.hidden) return;
          var old = slides[i]; old.classList.remove('on'); old.classList.add('prev');
          i = (i + 1) % slides.length; slides[i].classList.remove('prev'); slides[i].classList.add('on');
          setTimeout(function () { old.classList.remove('prev'); }, 1500);
        }, 5200);
      }, +tile.getAttribute('data-offset') || 0);
    });
  }

  // Scroll reveal; content stays visible without IntersectionObserver or with reduced motion.
  var items = document.querySelectorAll('[data-hreveal]');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('h-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    items.forEach(function (el) { io.observe(el); });
  }
})();
