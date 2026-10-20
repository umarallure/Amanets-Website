(function () {
  'use strict';
  var site = window.site, el = site.el, t = site.t;
  var main = document.getElementById('main');
  // The private token rides in the hash so it never reaches a server log or a Referer header.
  var token = location.hash.slice(1);
  var data = null, error = '', last = '', spanishRole = {};

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

  function copyButton(text, labelKey) {
    var button = el('button', { type: 'button', class: 'btn btn-line', text: t(labelKey) });
    button.addEventListener('click', function () {
      site.copy(text).then(function () {
        button.textContent = t('dash.copied');
        setTimeout(function () { button.textContent = t(labelKey); }, 1600);
      }, function () { button.textContent = t('dash.copyFail'); });
    });
    return button;
  }

  function render() {
    main.textContent = '';
    if (!token) {
      main.appendChild(el('section', { class: 'dash-card dash-notice' }, [
        el('h1', { text: t('dash.noToken') }), el('p', { text: t('dash.noTokenBody') }),
        el('a', { class: 'btn btn-ink', href: '/', text: t('dash.toPage') })
      ]));
      return;
    }
    if (!data) {
      main.appendChild(error
        ? el('section', { class: 'dash-card dash-notice' }, [el('p', { class: 'form-status', role: 'alert', text: error }), retry()])
        : el('p', { class: 'dash-loading', text: t('dash.loading') }));
      return;
    }
    var link = publicLink();
    var first = (data.partner.name || '').trim().split(/\s+/)[0];
    var share = el('div', { class: 'dash-share-actions' }, [copyButton(link, 'dash.copy')]);
    if (navigator.share) {
      var shareButton = el('button', { type: 'button', class: 'btn btn-red', text: t('dash.share') });
      shareButton.addEventListener('click', function () { navigator.share({ title: 'Amanets', text: t('dash.shareText'), url: link }).catch(function () {}); });
      share.insertBefore(shareButton, share.firstChild);
    }
    var qr = site.qr(link, 8);
    var people = data.applicants || [];
    var dateFormat = new Intl.DateTimeFormat(site.lang, { day: 'numeric', month: 'long', year: 'numeric' });

    main.append(
      el('div', { class: 'dash-head' }, [
        el('h1', { text: t('dash.hello').replace('{name}', first) }),
        el('p', { text: t('dash.intro') })
      ]),
      el('section', { class: 'dash-save' }, [
        el('div', {}, [el('h2', { text: t('dash.saveTitle') }), el('p', { text: t('dash.saveBody') })]),
        copyButton(location.href, 'dash.copyPrivate')
      ]),
      el('div', { class: 'dash-grid' }, [
        el('section', { class: 'dash-card dash-link' }, [
          el('h2', { text: t('dash.shareTitle') }),
          el('p', { text: t('dash.shareBody') }),
          el('code', { class: 'dash-url', text: link }),
          share,
          qr ? el('figure', { class: 'dash-qr' }, [
            el('img', { src: qr, width: '220', height: '220', alt: 'QR' }),
            el('a', { class: 'linkish', href: qr, download: 'amanets-' + data.partner.code + '.gif', text: t('dash.download') })
          ]) : null
        ]),
        el('section', { class: 'dash-card dash-people' }, [
          el('div', { class: 'dash-people-head' }, [el('h2', { text: t('dash.people') }), el('span', { class: 'dash-count', text: String(people.length) })]),
          people.length ? el('ul', { class: 'dash-list' }, people.map(function (p) {
            return el('li', {}, [
              el('div', {}, [el('b', { text: p.name }), el('span', { text: site.pick(p.role, spanishRole[p.role]) })]),
              el('span', { class: 'chip chip-' + p.status.toLowerCase().replace(/[^a-z]+/g, '-'), text: site.status(p.status) }),
              el('small', { text: t('dash.applied').replace('{date}', dateFormat.format(new Date(p.applied_at))) })
            ]);
          })) : el('p', { class: 'dash-empty', text: t('dash.empty') }),
          el('p', { class: 'dash-auto', text: t('dash.updated') })
        ])
      ])
    );
    if (error) main.insertBefore(el('p', { class: 'form-status', role: 'alert', text: error }), main.firstChild);
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
