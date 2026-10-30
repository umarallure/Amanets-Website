/* Link previews for role links (/j/<slug>, which the site serves as the Mérida page).
   WhatsApp, iMessage, Telegram and the like build their preview card from the page's raw HTML and never run the
   page's scripts, so a role link would otherwise show the generic Mérida title. vercel.json sends only those
   crawlers here (people still get the static page). We take merida.html and swap the
   title/description/og tags for the job. Anything unexpected serves the page unchanged. */
const fs = require('fs');
const path = require('path');

const API = 'https://app.powerpolicies.com';
// The jobs the Mérida page offers. Keep in step with MERIDA_ROLES in assets/referral.js.
const MERIDA_JOBS = ['Sales Agent', 'Sales Manager', 'Customer Support Manager', 'Executive Assistant', 'Office Receptionist',
  'Videographer', 'Content Creators', 'Social Media Manager', 'Finance / Accounting'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function setMeta(html, pattern, tag) {
  // A replacer function keeps "$" in job text from being read as a back-reference.
  return pattern.test(html) ? html.replace(pattern, () => tag) : html;
}

function build(html, job, host, slug, en) {
  const title = en ? job.title : (job.title_es || job.title);
  const lead = String(en ? job.description : (job.description_es || job.description) || '').trim();
  const pageTitle = en ? `${title} in Mérida | Amanet` : `${title} en Mérida | Amanet`;
  const description = (lead || (en
    ? `Apply for ${title} at Amanet, a US company with an office in Mérida. Applying is quick.`
    : `Postúlate a ${title} en Amanet, una empresa de EE. UU. con oficina en Mérida. Postularte es rápido.`)).slice(0, 200);
  const link = `https://${host}/j/${slug}${en ? '?lang=en' : ''}`;
  const image = `https://${host}/assets/og/role-${slug}-${en ? 'en' : 'es'}.jpg`;

  let out = html;
  out = setMeta(out, /<title>[^<]*<\/title>/, `<title>${esc(pageTitle)}</title>`);
  out = setMeta(out, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`);
  out = setMeta(out, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(pageTitle)}" />`);
  out = setMeta(out, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(description)}" />`);
  out = setMeta(out, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${esc(link)}" />`);
  // Crawlers need an absolute image address; each job has its own card, in both languages (assets/og/).
  out = setMeta(out, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(image)}" />`);
  out = setMeta(out, /<meta property="og:image:alt" content="[^"]*" \/>/, `<meta property="og:image:alt" content="${esc(pageTitle)}" />`);
  out = setMeta(out, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${esc(image)}" />`);
  out = setMeta(out, /<meta name="twitter:card" content="summary_large_image" \/>/,
    `<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${esc(pageTitle)}" />\n<meta name="twitter:description" content="${esc(description)}" />\n<meta property="og:locale" content="${en ? 'en_US' : 'es_ES'}" />`);
  return out;
}

module.exports = async (req, res) => {
  let html;
  try {
    html = fs.readFileSync(path.join(process.cwd(), 'merida.html'), 'utf8');
  } catch (e) {
    res.statusCode = 500;
    res.end('Unavailable');
    return;
  }

  try {
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.amanets.com').split(',')[0].trim();
    const url = new URL(req.url, `https://${host}`);
    const slug = (url.searchParams.get('role') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
    const en = url.searchParams.get('lang') === 'en';
    if (slug) {
      const response = await fetch(`${API}/api/referrals?roles=1`, { signal: AbortSignal.timeout(4000) });
      const roles = response.ok ? ((await response.json()).roles || []) : [];
      const job = roles.find((r) => r.slug === slug && r.active !== false && MERIDA_JOBS.includes(r.title));
      if (job) html = build(html, job, host, slug, en);
    }
  } catch (e) {
    // fall through with the page as it is
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  res.end(html);
};
