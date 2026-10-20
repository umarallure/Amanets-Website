# Amanets — Coming Soon

A single-page "coming soon" landing page. Pure static HTML/CSS/JS — no build step,
no dependencies, no framework.

```
index.html        markup
styles.css        all styling + keyframes
script.js         starfield canvas, letter stagger, counter, parallax, form
assets/
  favicon.svg     eclipse mark (browser tab icon)
  og.svg          social preview card
vercel.json       clean URLs, cache + security headers
robots.txt
```

## Run locally

Open `index.html` directly, or serve it (needed because paths are root-relative):

```bash
npx serve .
# or
python -m http.server 3000
```

## Deploy to Vercel

**CLI**

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Framework preset: **Other**. Build command: none. Output directory: `./`.

**Git**

Push the folder to GitHub/GitLab and import it at vercel.com — Vercel detects a
static site and deploys it as-is.

## What's animated

| Piece | Effect |
| --- | --- |
| Eclipse | breathing corona, pulsing rim, two counter-rotating light flares |
| Backdrop | ~200-star canvas that drifts and twinkles, plus random shooting stars |
| Headline | per-letter blur-up reveal, staggered 60ms apart |
| Progress | bar fills to 68% with a repeating sheen; the % counts up in sync |
| Logo | slow 22s rotation of the eclipse mark |
| Cursor | eclipse parallaxes ±16px against pointer movement (fine pointers only) |
| Grain | animated film-grain overlay |

Everything collapses gracefully under `prefers-reduced-motion: reduce` — the
starfield renders one static frame and the loop never starts.

## Mobile

Breakpoints at 900 / 640 / 400px, plus two viewport-height queries (landscape
phones and short portrait screens like the iPhone SE) so the whole page stays
inside the fold without scrolling.

On phones specifically:

- The signup form stacks, the button goes full width, and the footer centres.
- `#email` is forced to 16px on touch devices — anything smaller makes iOS Safari
  zoom the page in when the field is focused.
- Hover styles are wrapped in `@media (hover:hover) and (pointer:fine)` so they
  don't latch on and stay stuck after a tap.
- Tap targets grow to 44×44 (social icons) and 48px min-height (button).
- The page backdrop is a `position:fixed` layer rather than
  `background-attachment:fixed`, which stutters on iOS while the address bar
  collapses.
- Padding respects `env(safe-area-inset-*)` for notched devices.
- The starfield halves its density and caps DPR at 1.5 below 640px, ignores the
  resize events fired by the address bar sliding away (so stars don't reshuffle
  mid-scroll), and stops its RAF loop entirely when the tab is backgrounded.
- Cursor parallax is gated behind `pointer: fine`, so it never runs on touch.

## Things to change before launch

- **Brand name** — "Amanets" is used in the title, logo, and footer. Search and replace.
- **Progress %** — set in two places that must match: `--` the `68%` in the `fillUp`
  keyframe in [styles.css](styles.css), and `TARGET` in [script.js](script.js).
  Also update `aria-valuenow` on the progress element in [index.html](index.html).
- **Social links** — the X / Instagram / LinkedIn hrefs are `#` placeholders.
- **Email signup** — currently front-end only: it validates, shows a success state,
  and discards the address. Wire the marked block in [script.js](script.js) to a real
  endpoint (Vercel serverless function, Mailchimp, ConvertKit, Resend, …) before
  you rely on it collecting anything.
- **OG image** — `assets/og.svg` renders fine in browsers, but most social platforms
  (X, Facebook, LinkedIn, Slack) do not render SVG previews. Export it to
  `assets/og.png` at 1200×630 and point the `og:image` / `twitter:image` meta tags at
  the PNG when you want link previews to work.

## Careers & referral pages (`/referral`, `/referral/partner`)

Spanish-first careers page for the Mérida office, with an English switch. All data lives in the
Power Policies CRM — this site renders it and posts to the CRM's `/api/referrals`:

- `localhost` → `http://localhost:3000` (a local CRM), any `test`/`staging`/`preview`/`dev` host or
  `*.vercel.app` → `https://test.powerpolicies.com`, everything else → `https://app.powerpolicies.com`
  (see `assets/site.js`). The CRM must list this site's origin in `REFERRAL_PUBLIC_ORIGINS`.
- Positions, dropdown choices, extra questions and the intro video are edited in the CRM under
  Referrals → Setup. Every other word is in `assets/i18n.js`.
- `/referral/partner#<token>` is the partner's private dashboard; the token never leaves the hash.
- `/referral` has its own Content-Security-Policy in `vercel.json` — add any new API or video host there.
