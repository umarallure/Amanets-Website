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
    'hero.h1': 'Encuentra tu lugar.',
    'hero.lede': 'Trabaja con una empresa de Estados Unidos desde Kosovo o Venezuela. Trabajo real, capacitación real y espacio para crecer.',
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
    'foot.privacy': 'Aviso de privacidad',
    'soon.badge': 'Próximamente', 'soon.body': 'Estamos construyendo esta página. Mientras tanto, mira los puestos abiertos o vuelve al inicio.', 'soon.home': 'Volver al inicio'
  };
  var en = {};
  document.querySelectorAll('[data-i18n]').forEach(function (el) { en[el.getAttribute('data-i18n')] = en[el.getAttribute('data-i18n')] || el.textContent; });

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
  if (dropBtn) {
    dropBtn.addEventListener('click', function () { dropBtn.setAttribute('aria-expanded', String(dropBtn.getAttribute('aria-expanded') !== 'true')); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.hdrop')) dropBtn.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { dropBtn.setAttribute('aria-expanded', 'false'); if (nav) nav.classList.remove('open'); if (burger) burger.setAttribute('aria-expanded', 'false'); } });
  }
  var cur = document.querySelector('.hnav a[href="' + (location.pathname) + '"]');
  if (cur) cur.setAttribute('aria-current', 'page');

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
