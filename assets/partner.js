(function () {
  'use strict';
  var site = window.site, el = site.el, t = site.t;
  var main = document.getElementById('main');
  // The private token rides in the hash so it never reaches a server log or a Referer header.
  var token = location.hash.slice(1);
  var data = null, error = '', last = '', spanishRole = {};

  // Where an applicant is in the process, 1 to 5. Anything else (not selected, left) shows an empty bar.
  var STAGE = { New: 1, Contacted: 2, Interviewed: 3, Hired: 4, Started: 5 };
  var IN_PROCESS = ['New', 'Contacted', 'Interviewed'];
  var HIRED = ['Hired', 'Started'];

  site.apply();
  site.onLang(render);
  // Applicant rows carry the English role value; the Spanish title comes from the public config.
  fetch(site.API + '/api/referrals?roles=1').then(function (r) { return r.ok ? r.json() : null; }).then(function (body) {
    ((body && body.formConfig && body.formConfig.openings) || []).forEach(function (o) { spanishRole[o.title] = o.title_es; });
    if (data) render();
  }).catch(function () {});

  function load() {
    return fetch(site.API + '/api/referrals?partner=1', { cache: 'no-store', headers: { Authorization: 'Bearer ' + token } })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (body) { if (!r.ok) throw new Error(body.error || ''); return body; }); })
      // The poll re-renders only on a real change, so it never steals focus or resets a "Copied" label.
      .then(function (body) { var next = JSON.stringify(body); if (next === last && !error) return; last = next; data = body; error = ''; render(); })
      .catch(function (e) { error = e instanceof TypeError ? t('form.network') : site.apiError(e.message); render(); });
  }

  function publicLink() {
    var url = new URL('/', location.origin);
    url.searchParams.set('ref', data.partner.code);
    return url.toString();
  }

  function icon(name, cls) {
    var span = el('span', { class: cls || 'pv-ico', 'aria-hidden': 'true' });
    span.innerHTML = '<svg viewBox="0 0 24 24"><use href="#' + name + '"/></svg>';
    return span;
  }

  function copyButton(text, labelKey, cls) {
    var button = el('button', { type: 'button', class: cls || 'btn btn-line', text: t(labelKey) });
    button.addEventListener('click', function () {
      site.copy(text).then(function () {
        button.textContent = t('dash.copied');
        setTimeout(function () { button.textContent = t(labelKey); }, 1600);
      }, function () { button.textContent = t('dash.copyFail'); });
    });
    return button;
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/);
    return ((parts[0] || '').charAt(0) + (parts[1] || '').charAt(0)).toUpperCase() || '·';
  }

  function stageBar(status) {
    var n = STAGE[status] || 0;
    var bar = el('span', { class: 'stage' + (n ? '' : ' stage-off'), 'aria-hidden': 'true' });
    for (var i = 1; i <= 5; i++) bar.appendChild(el('i', { class: i <= n ? 'on' : '' }));
    return bar;
  }

  function stat(iconName, value, labelKey, hot) {
    return el('div', { class: 'stat' + (hot ? ' hot' : '') }, [
      icon(iconName, 'stat-ico'),
      el('b', { text: String(value) }),
      el('span', { text: t(labelKey) })
    ]);
  }


  // Direct-send links. The message is the existing share text plus the partner's own link.
  function sendTiles(link) {
    var message = t('dash.shareText') + ' ' + link;
    var enc = encodeURIComponent;
    var tiles = [
      ['i-whatsapp', 'WhatsApp', 'https://wa.me/?text=' + enc(message), true, 'wa'],
      ['i-telegram', 'Telegram', 'https://t.me/share/url?url=' + enc(link) + '&text=' + enc(t('dash.shareText')), true, 'tg'],
      ['i-sms', 'SMS', 'sms:?&body=' + enc(message), false, 'sms'],
      ['i-mail', t('dash.email'), 'mailto:?subject=' + enc('Amanet') + '&body=' + enc(message), false, 'mail']
    ];
    return el('div', { class: 'send' }, [
      el('p', { class: 'send-title', text: t('dash.sendTitle') }),
      el('div', { class: 'send-row' }, tiles.map(function (x) {
        var attrs = { class: 'send-tile send-' + x[4], href: x[2], title: x[1] };
        if (x[3]) { attrs.target = '_blank'; attrs.rel = 'noopener noreferrer'; }
        return el('a', attrs, [icon(x[0], 'send-ico'), el('span', { text: x[1] })]);
      }))
    ]);
  }

  // Three steps, top to bottom. The last one is the point of the programme.
  function processCard() {
    var steps = [
      ['i-share', 'partner.s2', 'partner.s2b'],
      ['i-eye', 'partner.s3', 'partner.s3b'],
      ['i-usd', 'dash.step3', 'dash.step3b']
    ];
    return el('section', { class: 'dash-card dash-how' }, [
      el('h2', { text: t('dash.how') }),
      el('ol', { class: 'dash-steps' }, steps.map(function (x, i) {
        return el('li', { class: i === steps.length - 1 ? 'is-last' : '' }, [
          icon(x[0], 'step-ico'),
          el('div', {}, [el('small', { text: '0' + (i + 1) }), el('b', { text: t(x[1]) }), el('span', { text: t(x[2]) })])
        ]);
      }))
    ]);
  }

  function backdrop() {
    var bg = el('div', { class: 'dash-bg', 'aria-hidden': 'true' });
    bg.innerHTML = '<picture><source type="image/webp" srcset="/assets/img/valley-800.webp" /><img src="/assets/img/valley-800.jpg" alt="" width="800" height="602" decoding="async" /></picture>';
    return bg;
  }

  // The page body lives in one centred column; hero and body bands are full width.
  function band(cls, children) {
    return el('div', { class: cls }, [el('div', { class: 'dash-inner' }, children)]);
  }

  function render() {
    main.textContent = '';
    if (!token) {
      main.appendChild(band('dash-body', [el('section', { class: 'dash-card dash-notice' }, [
        icon('i-lock'),
        el('h1', { text: t('dash.noToken') }), el('p', { text: t('dash.noTokenBody') }),
        el('a', { class: 'btn btn-red', href: '/', text: t('dash.toPage') })
      ])]));
      return;
    }
    if (!data) {
      main.appendChild(band('dash-body', [error
        ? el('section', { class: 'dash-card dash-notice' }, [el('p', { class: 'form-status', role: 'alert', text: error }), retry()])
        : el('p', { class: 'dash-loading', text: t('dash.loading') })]));
      return;
    }

    var link = publicLink();
    var first = (data.partner.name || '').trim().split(/\s+/)[0];
    var people = data.applicants || [];
    var inProcess = people.filter(function (p) { return IN_PROCESS.indexOf(p.status) > -1; }).length;
    var hired = people.filter(function (p) { return HIRED.indexOf(p.status) > -1; }).length;
    var dateFormat = new Intl.DateTimeFormat(site.lang, { day: 'numeric', month: 'long', year: 'numeric' });

    var share = el('div', { class: 'dash-share-actions' }, [copyButton(link, 'dash.copy')]);
    if (navigator.share) {
      var shareButton = el('button', { type: 'button', class: 'btn btn-red', text: t('dash.share') });
      shareButton.addEventListener('click', function () { navigator.share({ title: 'Amanet', text: t('dash.shareText'), url: link }).catch(function () {}); });
      share.insertBefore(shareButton, share.firstChild);
    }
    var qr = site.qr(link, 8);

    var hero = el('section', { class: 'dash-hero' }, [backdrop(), el('div', { class: 'dash-inner' }, [
      el('div', { class: 'dash-head' }, [
        el('p', { class: 'pill' }, [el('i', { class: 'dot', 'aria-hidden': 'true' }), el('span', { text: t('dash.badge') })]),
        el('h1', { text: t('dash.hello').replace('{name}', first) }),
        el('p', { class: 'dash-intro', text: t('dash.intro') })
      ]),
      el('div', { class: 'dash-stats' }, [
        stat('i-user', people.length, 'dash.stat1'),
        stat('i-clock', inProcess, 'dash.stat2'),
        stat('i-check', hired, 'dash.stat3', hired > 0)
      ])
    ])]);

    var save = el('section', { class: 'dash-save' }, [
      icon('i-lock'),
      el('div', {}, [el('h2', { text: t('dash.saveTitle') }), el('p', { text: t('dash.saveBody') })]),
      copyButton(location.href, 'dash.copyPrivate', 'btn btn-red')
    ]);

    var qrFigure = qr ? el('figure', { class: 'dash-qr' }, [
      el('img', { src: qr, width: '200', height: '200', alt: 'QR' }),
      el('a', { class: 'linkish', href: qr, download: 'amanet-' + data.partner.code + '.gif', text: t('dash.download') })
    ]) : null;
    var linkCard = el('section', { class: 'dash-card dash-link' }, [
      el('div', { class: 'dash-card-top' }, [icon('i-link'), el('h2', { text: t('dash.shareTitle') })]),
      el('p', { text: t('dash.shareBody') }),
      el('div', { class: 'dash-link-grid' }, [
        el('div', { class: 'dash-link-main' }, [el('code', { class: 'dash-url', text: link }), share]),
        el('div', { class: 'dash-link-side' }, [qrFigure, sendTiles(link)])
      ])
    ]);

    var listBody = people.length
      ? el('ul', { class: 'dash-list' }, people.map(function (p) {
        return el('li', {}, [
          el('span', { class: 'avatar', 'aria-hidden': 'true', text: initials(p.name) }),
          el('div', { class: 'who' }, [el('b', { text: p.name }), el('span', { text: site.pick(p.role, spanishRole[p.role]) })]),
          el('span', { class: 'chip chip-' + p.status.toLowerCase().replace(/[^a-z]+/g, '-'), text: site.status(p.status) }),
          stageBar(p.status),
          el('small', { text: t('dash.applied').replace('{date}', dateFormat.format(new Date(p.applied_at))) })
        ]);
      }))
      : el('div', { class: 'dash-empty' }, [icon('i-user'), el('p', { text: t('dash.empty') })]);

    var peopleCard = el('section', { class: 'dash-card dash-people' }, [
      el('div', { class: 'dash-people-head' }, [el('h2', { text: t('dash.people') }), el('span', { class: 'dash-count', text: String(people.length) })]),
      listBody,
      el('p', { class: 'dash-auto' }, [el('i', { class: 'live', 'aria-hidden': 'true' }), el('span', { text: t('dash.updated') })])
    ]);

    var inner = [save, el('div', { class: 'dash-grid' }, [processCard(), linkCard]), peopleCard];
    if (error) inner.unshift(el('p', { class: 'form-status', role: 'alert', text: error }));
    main.append(hero, band('dash-body', inner));
  }

  function retry() {
    var b = el('button', { type: 'button', class: 'btn btn-ink', text: t('dash.retry') });
    b.addEventListener('click', function () { error = ''; render(); load(); });
    return b;
  }

  render();
  if (token) {
    load();
    setInterval(function () { if (document.visibilityState === 'visible') load(); }, 15000);
    addEventListener('focus', function () { load(); });
  }
})();
