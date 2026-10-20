/* Amanets careers & referrals — shared runtime for /referral and /referral/partner.
   The data lives in the Power Policies CRM; this site only renders it and posts to its API. */
(function () {
  'use strict';

  /* Test traffic must land in the CRM's dev database, never in production. Local and preview
     hosts talk to a local CRM (localhost) or the test CRM; everything else is production. */
  var host = location.hostname;
  var PRODUCTION_HOSTS = ['amanets-website.vercel.app'];
  var API = /^(localhost|127\.0\.0\.1)$/.test(host) ? 'http://localhost:3000'
    : PRODUCTION_HOSTS.indexOf(host) < 0 && /(^|[.-])(test|staging|preview|dev)[.-]|\.vercel\.app$/.test(host) ? 'https://test.powerpolicies.com'
    : 'https://app.powerpolicies.com';

  var STATUS = {
    New: ['New', 'Nuevo'], Contacted: ['Contacted', 'Contactado'], Interviewed: ['Interviewed', 'Entrevistado'],
    Hired: ['Hired', 'Contratado'], Started: ['Started work', 'Comenzó a trabajar'],
    'Left after starting': ['Left after starting', 'Se retiró'], 'Not selected': ['Not selected', 'No seleccionado']
  };

  // The CRM answers in English; these are the messages a visitor can actually hit.
  var API_ERRORS = {
    'Please complete the required fields and consent.': 'Completa los campos obligatorios y acepta el aviso de privacidad.',
    'This referral link is no longer active. Ask the partner for a new link.': 'Este enlace de referido ya no está activo. Pide un enlace nuevo a quien te lo compartió.',
    'We couldn’t verify this referral link. Please try again.': 'No pudimos verificar el enlace de referido. Inténtalo de nuevo.',
    'Upload a PDF, DOC, or DOCX file under 4 MB.': 'Sube un archivo PDF, DOC o DOCX de menos de 4 MB.',
    'We couldn’t upload your CV. Please try again.': 'No pudimos subir tu CV. Inténtalo de nuevo.',
    'We couldn’t save your application. Please try again.': 'No pudimos guardar tu solicitud. Inténtalo de nuevo.',
    'There are no open positions right now.': 'No hay puestos abiertos en este momento.',
    'We couldn’t create your partner account. Please try again.': 'No pudimos crear tu cuenta de socio. Inténtalo de nuevo.',
    'Partner access is no longer active.': 'Este acceso de socio ya no está activo.',
    'We couldn’t load your referrals. Please try again.': 'No pudimos cargar tus referidos. Inténtalo de nuevo.'
  };

  var COUNTRIES = 'US|1,CA|1,GB|44,AF|93,AL|355,DZ|213,AD|376,AO|244,AG|1,AR|54,AM|374,AU|61,AT|43,AZ|994,BS|1,BH|973,BD|880,BB|1,BY|375,BE|32,BZ|501,BJ|229,BT|975,BO|591,BA|387,BW|267,BR|55,BN|673,BG|359,BF|226,BI|257,KH|855,CM|237,CV|238,CF|236,TD|235,CL|56,CN|86,CO|57,KM|269,CG|242,CD|243,CR|506,CI|225,HR|385,CU|53,CY|357,CZ|420,DK|45,DJ|253,DM|1,DO|1,EC|593,EG|20,SV|503,GQ|240,ER|291,EE|372,SZ|268,ET|251,FJ|679,FI|358,FR|33,GA|241,GM|220,GE|995,DE|49,GH|233,GR|30,GD|1,GT|502,GN|224,GW|245,GY|592,HT|509,HN|504,HU|36,IS|354,IN|91,ID|62,IR|98,IQ|964,IE|353,IL|972,IT|39,JM|1,JP|81,JO|962,KZ|7,KE|254,KI|686,XK|383,KW|965,KG|996,LA|856,LV|371,LB|961,LS|266,LR|231,LY|218,LI|423,LT|370,LU|352,MG|261,MW|265,MY|60,MV|960,ML|223,MT|356,MH|692,MR|222,MU|230,MX|52,FM|691,MD|373,MC|377,MN|976,ME|382,MA|212,MZ|258,MM|95,NA|264,NR|674,NP|977,NL|31,NZ|64,NI|505,NE|227,NG|234,KP|850,MK|389,NO|47,OM|968,PK|92,PW|680,PA|507,PG|675,PY|595,PE|51,PH|63,PL|48,PT|351,QA|974,RO|40,RU|7,RW|250,KN|1,LC|1,VC|1,WS|685,SM|378,ST|239,SA|966,SN|221,RS|381,SC|248,SL|232,SG|65,SK|421,SI|386,SB|677,SO|252,ZA|27,KR|82,SS|211,ES|34,LK|94,SD|249,SR|597,SE|46,CH|41,SY|963,TW|886,TJ|992,TZ|255,TH|66,TL|670,TG|228,TO|676,TT|1,TN|216,TR|90,TM|993,TV|688,UG|256,UA|380,AE|971,UY|598,UZ|998,VU|678,VA|39,VE|58,VN|84,YE|967,ZM|260,ZW|263'
    .split(',').map(function (row) { var p = row.split('|'); return { code: p[0], dial: p[1] }; });
  var FEATURED = ['VE', 'US', 'CO'];

  function pickLang() {
    var forced = new URLSearchParams(location.search).get('lang');
    if (forced === 'en' || forced === 'es') return forced;
    try { var saved = localStorage.getItem('amanets-lang'); if (saved === 'en' || saved === 'es') return saved; } catch (e) {}
    return 'es';
  }

  var site = {
    API: API,
    lang: pickLang(),
    dict: { en: {}, es: {} },
    listeners: [],
    t: function (key) { return (site.dict[site.lang] || {})[key] || site.dict.en[key] || key; },
    pick: function (en, es) { return site.lang === 'es' ? (es || en) : en; },
    status: function (value) { var s = STATUS[value]; return s ? s[site.lang === 'es' ? 1 : 0] : value; },
    apiError: function (message) { return site.lang === 'es' ? (API_ERRORS[message] || 'Algo salió mal. Inténtalo de nuevo.') : (message || 'Something went wrong. Please try again.'); },
    onLang: function (fn) { site.listeners.push(fn); },
    setLang: function (lang) {
      site.lang = lang;
      try { localStorage.setItem('amanets-lang', lang); } catch (e) {}
      site.apply();
      site.listeners.forEach(function (fn) { fn(lang); });
    },
    /* Static copy: data-i18n sets text, data-i18n-attr="placeholder:key;aria-label:key" sets attributes. */
    apply: function (root) {
      root = root || document;
      document.documentElement.lang = site.lang;
      root.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = site.t(el.getAttribute('data-i18n')); });
      root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
        el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
          var p = pair.split(':'); if (p.length === 2) el.setAttribute(p[0].trim(), site.t(p[1].trim()));
        });
      });
      document.querySelectorAll('.lang-switch button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === site.lang));
      });
      if (site.dict[site.lang]['meta.title']) document.title = site.t('meta.title');
    },
    countries: function () {
      var names;
      try { names = new Intl.DisplayNames([site.lang], { type: 'region' }); } catch (e) { names = null; }
      var rows = COUNTRIES.map(function (c) { return { code: c.code, dial: c.dial, name: names ? names.of(c.code) : c.code }; });
      var top = FEATURED.map(function (code) { return rows.filter(function (r) { return r.code === code; })[0]; });
      var rest = rows.filter(function (r) { return FEATURED.indexOf(r.code) < 0; })
        .sort(function (a, b) { return a.name.localeCompare(b.name, site.lang); });
      return { top: top, rest: rest };
    },
    el: function (tag, attrs, children) {
      var node = document.createElement(tag);
      Object.keys(attrs || {}).forEach(function (k) {
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'class') node.className = attrs[k];
        else if (attrs[k] !== false && attrs[k] != null) node.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
      });
      (children || []).forEach(function (c) { if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
      return node;
    },
    qr: function (value, cell) {
      if (!window.qrcode) return '';
      var code = window.qrcode(0, 'M'); code.addData(value); code.make();
      return code.createDataURL(cell || 6, 2);
    },
    copy: function (text) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
      var area = document.createElement('textarea');
      area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select();
      var ok = document.execCommand('copy'); area.remove();
      return ok ? Promise.resolve() : Promise.reject(new Error('copy'));
    }
  };

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('.lang-switch button');
    if (button) site.setLang(button.getAttribute('data-lang'));
  });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  window.site = site;
})();
