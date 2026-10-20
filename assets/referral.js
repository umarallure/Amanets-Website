(function () {
  'use strict';
  var site = window.site, el = site.el, t = site.t;
  var params = new URLSearchParams(location.search);
  var ref = (params.get('ref') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  // "Keller" is the CEO's own QR code; printed codes without ?src= are his.
  var source = (params.get('src') || 'Keller').slice(0, 40);
  var OTHER_SCHOOL = 'Other university';
  var MAX_CV = 4 * 1024 * 1024;
  var config = null, openings = [], configFailed = false;
  var sheet = document.getElementById('sheet');

  site.apply();
  requestAnimationFrame(function () { document.documentElement.classList.add('ready'); });
  if (ref) document.getElementById('invite').hidden = false;

  /* ── Roles and video from the CRM ─────────────────────────── */
  fetch(site.API + '/api/referrals?roles=1', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(function (data) { config = data.formConfig; openings = data.roles || []; renderRoles(); renderVideo(); })
    .catch(function () { configFailed = true; renderRoles(); });

  function renderRoles() {
    var list = document.getElementById('roles');
    list.textContent = '';
    if (configFailed || !openings.length) {
      list.appendChild(el('li', { class: 'roles-empty', text: t(configFailed ? 'careers.offline' : 'careers.none') }));
      return;
    }
    openings.forEach(function (opening) {
      var title = site.pick(opening.title, opening.title_es);
      var description = site.pick(opening.description, opening.description_es);
      var meta = [opening.location, opening.vacancies > 1 ? t('careers.openings').replace('{n}', opening.vacancies) : opening.vacancies === 1 ? t('careers.opening') : ''].filter(Boolean);
      var button = el('button', { type: 'button', class: 'role', 'aria-label': t('careers.applyRole') + ': ' + title }, [
        el('span', { class: 'role-title', text: title }),
        meta.length ? el('span', { class: 'role-meta' }, meta.map(function (m) { return el('span', { text: m }); })) : null,
        description ? el('span', { class: 'role-desc', text: description }) : null,
        el('span', { class: 'role-go', 'aria-hidden': 'true' })
      ]);
      button.addEventListener('click', function () { openForm('apply', opening.title); });
      list.appendChild(el('li', {}, [button]));
    });
  }

  function embedUrl(url) {
    var m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/))) return 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0';
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1';
    if ((m = url.match(/loom\.com\/(?:share|embed)\/([\w]+)/))) return 'https://www.loom.com/embed/' + m[1] + '?autoplay=1';
    return '';
  }
  function renderVideo() {
    var url = config && config.videoUrl;
    if (!url) return;
    var frame = document.getElementById('video-frame');
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
      frame.textContent = '';
      frame.appendChild(el('video', { src: url, controls: true, playsinline: true, preload: 'metadata' }));
      return;
    }
    var embed = embedUrl(url);
    if (!embed) return;
    // The player loads on tap: a third-party iframe up front costs a phone on mobile data seconds.
    var play = el('button', { type: 'button', class: 'video-play', 'data-i18n-attr': 'aria-label:video.play', 'aria-label': t('video.play') }, [
      el('img', { src: '/assets/brand/mark-white.png', width: '160', height: '96', alt: '' }),
      el('span', { class: 'video-play-icon', 'aria-hidden': 'true' })
    ]);
    play.addEventListener('click', function () {
      frame.textContent = '';
      frame.appendChild(el('iframe', { src: embed, title: t('video.watch'), allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true }));
    });
    frame.textContent = '';
    frame.appendChild(play);
  }

  site.onLang(function () {
    if (config || configFailed) renderRoles();
    relabel(sheet);
  });

  /* ── Forms ─────────────────────────────────────────────────── */
  document.addEventListener('click', function (event) {
    var opener = event.target.closest && event.target.closest('[data-open]');
    if (opener) openForm(opener.getAttribute('data-open'));
  });

  var uid = 0;
  function field(labelKey, control, opts) {
    opts = opts || {};
    var id = control.id || (control.id = 'f' + (++uid));
    var label = el('label', { for: id }, [el('span', { 'data-i18n': labelKey, text: t(labelKey) })]);
    if (opts.required) label.appendChild(el('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }));
    if (opts.required) control.required = true;
    var error = el('p', { class: 'field-error', id: id + '-err', hidden: true });
    control.setAttribute('aria-describedby', (opts.hint ? id + '-hint ' : '') + id + '-err');
    return el('div', { class: 'field' + (opts.wide ? ' wide' : '') }, [
      label, control,
      opts.hint ? el('p', { class: 'field-hint', id: id + '-hint', 'data-i18n': opts.hint, text: t(opts.hint) }) : null,
      error
    ]);
  }
  /* Options carry both languages so a language switch relabels them without losing the answer. */
  function choice(name, choices, required) {
    var select = el('select', { name: name }, [el('option', { value: '', 'data-i18n': 'form.select', text: t('form.select') })]);
    (choices || []).forEach(function (c) {
      select.appendChild(el('option', { value: c.value, 'data-en': c.value, 'data-es': c.es || c.value, text: site.pick(c.value, c.es) }));
    });
    if (required) select.required = true;
    return select;
  }
  function relabel(root) {
    if (!root) return;
    site.apply(root);
    root.querySelectorAll('option[data-en]').forEach(function (o) { o.textContent = site.pick(o.getAttribute('data-en'), o.getAttribute('data-es')); });
    root.querySelectorAll('label[data-en]').forEach(function (l) { l.firstChild.textContent = site.pick(l.getAttribute('data-en'), l.getAttribute('data-es')); });
    var code = root.querySelector('select[name="phone_code"]');
    if (code) fillCountries(code, code.value);
  }
  function fillCountries(select, selected) {
    var lists = site.countries();
    select.textContent = '';
    // Code first: the closed select is narrow on a phone and the dial code is what matters there.
    var add = function (parent, c) { parent.appendChild(el('option', { value: c.code, text: '+' + c.dial + ' ' + c.name, 'data-dial': c.dial })); };
    lists.top.forEach(function (c) { add(select, c); });
    var rest = el('optgroup', { label: '──────' });
    lists.rest.forEach(function (c) { add(rest, c); });
    select.appendChild(rest);
    select.value = selected || 'VE';
  }
  function section(key, children) {
    return el('fieldset', { class: 'group' }, [el('legend', { 'data-i18n': key, text: t(key) })].concat(children));
  }

  function buildForm(kind, role) {
    var cfg = config || {};
    var apply = kind === 'apply';
    var form = el('form', { class: 'form', novalidate: true });

    var code = el('select', { name: 'phone_code', class: 'phone-code', 'data-i18n-attr': 'aria-label:form.phoneCode', 'aria-label': t('form.phoneCode') });
    fillCountries(code, 'VE');
    var local = el('input', { name: 'phone_local', type: 'tel', inputmode: 'tel', autocomplete: 'tel-national', maxlength: '20', 'data-i18n-attr': 'placeholder:form.phonePlaceholder', placeholder: t('form.phonePlaceholder') });
    var phone = field('form.phone', local, { required: true });
    phone.insertBefore(el('div', { class: 'phone' }, [code, local]), phone.querySelector('.field-error'));

    var school = choice('school', cfg.schoolOptions, true);
    var other = field('form.schoolOther', el('input', { name: 'school_other', maxlength: '140', autocomplete: 'organization' }));
    other.hidden = true;
    school.addEventListener('change', function () {
      other.hidden = school.value !== OTHER_SCHOOL;
      other.querySelector('input').required = !other.hidden;
    });

    var about = [
      field('form.name', el('input', { name: 'name', maxlength: '140', autocomplete: 'name' }), { required: true, wide: true }),
      field(apply ? 'form.emailOptional' : 'form.email', el('input', { name: 'email', type: 'email', inputmode: 'email', maxlength: '254', autocomplete: 'email', spellcheck: 'false' }), { required: !apply }),
      phone,
      field('form.city', el('input', { name: 'city', maxlength: '100', autocomplete: 'address-level2', value: 'Mérida' }), { required: true })
    ];
    if (!apply) about.push(field('form.age', el('input', { name: 'age', type: 'number', inputmode: 'numeric', min: '18', max: '100' }), { required: true }));

    form.appendChild(section('form.aboutYou', about));
    var studies = [field('form.school', school, { required: true }), other, field('form.working', choice('working_status', cfg.workStatusOptions, true), { required: true })];
    if (apply) studies.push(field('form.schedule', choice('work_schedule', cfg.scheduleOptions, true), { required: true }));
    form.appendChild(section('form.studies', studies));

    if (apply) {
      var roleSelect = choice('role', openings.map(function (o) { return { value: o.title, es: o.title_es }; }), true);
      if (role) roleSelect.value = role;
      form.appendChild(section('form.position', [
        field('form.role', roleSelect, { required: true, wide: true }),
        field('form.english', choice('english', cfg.englishOptions, true), { required: true }),
        field('form.availability', choice('availability', cfg.availabilityOptions, true), { required: true })
      ]));
    }

    var extra = (apply ? cfg.applicantFields : cfg.partnerFields) || [];
    var more = extra.map(function (q) {
      var name = 'custom_' + q.key;
      var control = q.type === 'select' ? choice(name, q.options, q.required)
        : q.type === 'textarea' ? el('textarea', { name: name, rows: '3', maxlength: '1000' })
        : el('input', { name: name, maxlength: '1000' });
      var wrap = field('', control, { required: q.required, wide: q.type === 'textarea' });
      var label = wrap.querySelector('label');
      label.setAttribute('data-en', q.label); label.setAttribute('data-es', q.label_es || q.label);
      label.firstChild.removeAttribute('data-i18n');
      label.firstChild.textContent = site.pick(q.label, q.label_es);
      return wrap;
    });
    if (apply) {
      more.push(field('form.note', el('textarea', { name: 'note', rows: '3', maxlength: '1200' }), { wide: true, hint: 'form.optional' }));
      more.push(cvField());
    }
    if (more.length) form.appendChild(section('form.more', more));

    form.appendChild(el('label', { class: 'honey', 'aria-hidden': 'true' }, ['Website', el('input', { name: 'website', tabindex: '-1', autocomplete: 'off' })]));
    var consent = el('input', { type: 'checkbox', name: 'consent', required: true, id: 'f' + (++uid) });
    form.appendChild(el('div', { class: 'consent' }, [
      el('label', { for: consent.id }, [consent, el('span', { 'data-i18n': apply ? 'form.consentApply' : 'form.consentPartner', text: t(apply ? 'form.consentApply' : 'form.consentPartner') })]),
      el('a', { href: '#privacy', class: 'consent-link', 'data-close': '', 'data-i18n': 'privacy.title', text: t('privacy.title') })
    ]));
    var status = el('p', { class: 'form-status', role: 'alert' });
    var submit = el('button', { type: 'submit', class: 'btn btn-red btn-lg btn-block', 'data-i18n': apply ? 'form.submitApply' : 'form.submitPartner', text: t(apply ? 'form.submitApply' : 'form.submitPartner') });
    form.appendChild(el('div', { class: 'form-foot' }, [status, submit]));

    // The CV field checks its own file on change; clearing here would wipe that message as it appears.
    var edited = function (e) { if (e.target.type !== 'file' && e.target.getAttribute('aria-invalid')) clearError(e.target); };
    form.addEventListener('input', edited);
    form.addEventListener('change', edited);
    form.addEventListener('submit', function (e) { e.preventDefault(); send(form, kind, status, submit); });
    return form;
  }

  function cvField() {
    var input = el('input', { type: 'file', name: 'cv', class: 'cv-input', accept: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    var wrap = field('form.cv', input, { hint: 'form.cvHint', wide: true });
    var name = el('span', { class: 'cv-name' });
    var remove = el('button', { type: 'button', class: 'linkish', hidden: true, 'data-i18n': 'form.cvRemove', text: t('form.cvRemove') });
    var pick = el('span', { class: 'btn btn-line btn-sm', 'aria-hidden': 'true', 'data-i18n': 'form.cvPick', text: t('form.cvPick') });
    wrap.querySelector('label').appendChild(pick);
    wrap.insertBefore(el('div', { class: 'cv-row' }, [name, remove]), wrap.querySelector('.field-hint'));
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      name.textContent = file ? file.name : '';
      remove.hidden = !file;
      clearError(input);
      if (file && !/\.(pdf|docx?)$/i.test(file.name)) showError(input, 'form.cvType');
      else if (file && file.size > MAX_CV) showError(input, 'form.cvTooBig');
    });
    remove.addEventListener('click', function () { input.value = ''; name.textContent = ''; remove.hidden = true; clearError(input); });
    return wrap;
  }

  function showError(control, key) {
    control.setAttribute('aria-invalid', 'true');
    var err = document.getElementById(control.id + '-err');
    if (err) { err.hidden = false; err.setAttribute('data-i18n', key); err.textContent = t(key); }
  }
  function clearError(control) {
    control.removeAttribute('aria-invalid');
    var err = document.getElementById(control.id + '-err');
    if (err) { err.hidden = true; err.removeAttribute('data-i18n'); err.textContent = ''; }
  }

  function validate(form) {
    var first = null;
    form.querySelectorAll('input, select, textarea').forEach(function (c) {
      if (c.type === 'checkbox' || c.name === 'website' || c.name === 'phone_code' || c.closest('[hidden]')) return;
      var value = (c.value || '').trim(), key = '';
      if (c.type === 'file') {
        var file = c.files && c.files[0];
        if (file && !/\.(pdf|docx?)$/i.test(file.name)) key = 'form.cvType';
        else if (file && file.size > MAX_CV) key = 'form.cvTooBig';
      } else if (c.required && !value) key = 'form.required';
      else if (c.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) key = 'form.invalidEmail';
      else if (c.name === 'phone_local' && !/^[\d\s().-]{6,18}$/.test(value)) key = 'form.invalidPhone';
      else if (c.name === 'age' && !(Number(value) >= 18 && Number(value) <= 100 && Number.isInteger(Number(value)))) key = 'form.invalidAge';
      if (key) { showError(c, key); first = first || c; } else clearError(c);
    });
    var consent = form.querySelector('[name="consent"]');
    consent.closest('.consent').classList.toggle('is-invalid', !consent.checked);
    if (!consent.checked) first = first || consent;
    return first;
  }

  function send(form, kind, status, submit) {
    status.textContent = ''; status.removeAttribute('data-i18n');
    var invalid = validate(form);
    if (invalid) {
      status.setAttribute('data-i18n', 'form.fix'); status.textContent = t('form.fix');
      invalid.focus();
      return;
    }
    var data = new FormData(form);
    var code = form.querySelector('[name="phone_code"]');
    var dial = code.options[code.selectedIndex].getAttribute('data-dial');
    var number = String(data.get('phone_local')).trim().replace(/^0+/, '');
    data.set('phone', '+' + dial + ' ' + number);
    data.delete('phone_local'); data.delete('phone_code');
    var custom = {};
    Array.from(data.keys()).filter(function (k) { return k.indexOf('custom_') === 0; }).forEach(function (k) { custom[k.slice(7)] = data.get(k); data.delete(k); });
    data.set('custom_fields', JSON.stringify(custom));
    if (data.get('cv') instanceof File && !data.get('cv').size) data.delete('cv');
    data.set('action', kind); data.set('ref', ref); data.set('source', source);
    submit.disabled = true; submit.setAttribute('data-i18n', 'form.sending'); submit.textContent = t('form.sending');
    fetch(site.API + '/api/referrals', { method: 'POST', body: data })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (body) { return { ok: r.ok, body: body }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(site.apiError(res.body.error));
        if (kind === 'partner') { location.assign('/referral/partner#' + res.body.token); return; }
        showDone();
      })
      .catch(function (error) {
        status.removeAttribute('data-i18n');
        status.textContent = error instanceof TypeError ? t('form.network') : error.message;
      })
      .then(function () {
        submit.disabled = false;
        var key = kind === 'apply' ? 'form.submitApply' : 'form.submitPartner';
        submit.setAttribute('data-i18n', key); submit.textContent = t(key);
      });
  }

  /* ── The sheet ──────────────────────────────────────────────── */
  function header(titleKey, introKey) {
    var langs = document.querySelector('.bar .lang-switch').cloneNode(true);
    var close = el('button', { type: 'button', class: 'sheet-close', 'data-close': '', 'data-i18n-attr': 'aria-label:form.close', 'aria-label': t('form.close') });
    // Only the language and close controls stay pinned; the title scrolls away to free the phone screen.
    return [
      el('div', { class: 'sheet-tools' }, [langs, close]),
      el('div', { class: 'sheet-top' }, [
        el('h2', { id: 'sheet-title', 'data-i18n': titleKey, text: t(titleKey) }),
        el('p', { class: 'sheet-intro', 'data-i18n': introKey, text: t(introKey) })
      ])
    ];
  }
  function openForm(kind, role) {
    sheet.textContent = '';
    var apply = kind === 'apply';
    var body = el('div', { class: 'sheet-body' }, header(apply ? 'form.applyTitle' : 'form.partnerTitle', apply ? 'form.applyIntro' : 'form.partnerIntro'));
    if (ref) body.appendChild(el('p', { class: 'invite', 'data-i18n': 'form.linked', text: t('form.linked') }));
    body.appendChild(buildForm(kind, role));
    sheet.appendChild(body);
    site.apply(sheet);
    if (!sheet.open) sheet.showModal();
    sheet.scrollTop = 0;
    var firstInput = sheet.querySelector('input[name="name"]');
    if (firstInput && matchMedia('(pointer: fine)').matches) firstInput.focus();
    else sheet.querySelector('.sheet-close').focus();
  }
  function showDone() {
    sheet.textContent = '';
    var back = el('button', { type: 'button', class: 'btn btn-ink btn-lg', 'data-close': '', 'data-i18n': 'form.doneBack', text: t('form.doneBack') });
    var refer = el('button', { type: 'button', class: 'btn btn-line btn-lg', 'data-i18n': 'form.doneRefer', text: t('form.doneRefer') });
    refer.addEventListener('click', function () { openForm('partner'); });
    sheet.appendChild(el('div', { class: 'sheet-body done' }, [
      el('img', { src: '/assets/brand/mark-black.png', width: '120', height: '72', alt: '', class: 'done-mark' }),
      el('h2', { id: 'sheet-title', 'data-i18n': 'form.doneTitle', text: t('form.doneTitle') }),
      el('p', { 'data-i18n': 'form.doneBody', text: t('form.doneBody') }),
      el('div', { class: 'done-actions' }, [back, refer])
    ]));
    back.focus();
  }
  sheet.addEventListener('click', function (event) {
    if (event.target === sheet || (event.target.closest && event.target.closest('[data-close]'))) sheet.close();
  });
})();
