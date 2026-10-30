"""Builds the link-preview cards (1200 x 630) in assets/og/ for the site pages and each Mérida job.

Run again whenever a Mérida job is added or renamed:  python tools/make-og-cards.py
Needs Pillow (pip install pillow). Uses Space Grotesk (SIL Open Font License, see tools/fonts/OFL.txt); set FONT_BOLD / FONT_REGULAR to use other .ttf files.
Job names and slugs come from the CRM's public config. The job list must match MERIDA_JOBS in api/role-preview.js
and MERIDA_ROLES in assets/referral.js."""
import json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'og')
os.makedirs(OUT, exist_ok=True)
W, H = 1200, 630
BG, RED, REDHOT, WHITE, SOFT = (9, 9, 9), (215, 25, 32), (255, 77, 85), (245, 245, 245), (190, 190, 190)
FONT_B = os.environ.get('FONT_BOLD', os.path.join(ROOT, 'tools', 'fonts', 'SpaceGrotesk-Bold.ttf'))
FONT_R = os.environ.get('FONT_REGULAR', os.path.join(ROOT, 'tools', 'fonts', 'SpaceGrotesk-Regular.ttf'))
logo = Image.open(os.path.join(ROOT, 'assets', 'brand', 'amanet-white.png')).convert('RGBA')

def font(path, size): return ImageFont.truetype(path, size)

def wrap(draw, text, fnt, width):
    lines, line = [], ''
    for word in text.split(' '):
        trial = (line + ' ' + word).strip()
        if draw.textlength(trial, font=fnt) <= width: line = trial
        else:
            if line: lines.append(line)
            line = word
    if line: lines.append(line)
    return lines

def background():
    img = Image.new('RGB', (W, H), BG)
    glow = Image.new('RGB', (W, H), BG)
    g = ImageDraw.Draw(glow)
    g.ellipse((640, 150, 1500, 1010), fill=(120, 14, 20))
    g.ellipse((860, 330, 1380, 850), fill=(215, 25, 32))
    glow = glow.filter(ImageFilter.GaussianBlur(170))
    img = Image.blend(img, glow, 0.9)
    # faint chessboard squares in the corner, a nod to the brand's chess theme
    sq = ImageDraw.Draw(img, 'RGBA')
    size = 54
    for r in range(4):
        for c in range(8):
            if (r + c) % 2 == 0:
                x, y = W - (c + 1) * size - 0, H - (r + 1) * size
                if c < 8: sq.rectangle((x, y, x + size, y + size), fill=(255, 255, 255, 14))
    return img

def card(path, kicker, title, tail, footer_l, footer_r):
    img = background()
    d = ImageDraw.Draw(img)
    lw = 280
    lg = logo.resize((lw, int(lw * logo.height / logo.width)), Image.LANCZOS)
    img.paste(lg, (72, 62), lg)
    d.text((72, 168), kicker.upper(), font=font(FONT_B, 26), fill=REDHOT, spacing=4)
    tf = font(FONT_B, 92)
    lines = wrap(d, title, tf, 1000)
    size = 92
    while len(lines) > 2 and size > 64:
        size -= 6; tf = font(FONT_B, size); lines = wrap(d, title, tf, 1000)
    y = 214
    for ln in lines[:3]:
        d.text((72, y), ln, font=tf, fill=WHITE); y += int(size * 1.08)
    d.text((72, y + 4), tail, font=tf, fill=REDHOT)
    d.rectangle((72, 540, 1128, 541), fill=(60, 60, 60))
    d.text((72, 558), footer_l, font=font(FONT_R, 28), fill=SOFT)
    rf = font(FONT_R, 28)
    d.text((1128 - d.textlength(footer_r, font=rf), 558), footer_r, font=rf, fill=SOFT)
    img.save(os.path.join(OUT, path), 'JPEG', quality=88, optimize=True)

# ---- pages ----
card('home.jpg', 'Amanet', 'People & Possibility', 'Find your place.', 'amanets.com', 'Kosovo · Mérida · Puerto Rico')
card('merida.jpg', 'Amanet · Mérida', 'Empleos en Mérida', 'Postúlate hoy.', 'amanets.com/merida', 'Empresa de EE. UU. · Capacitación desde el primer día')
card('puerto-rico.jpg', 'Amanet · Puerto Rico', 'Agentes de ventas en Puerto Rico', 'Vende desde la isla.', 'amanets.com/puerto-rico', 'Empresa de EE. UU. · Equipo bilingüe')
card('developers.jpg', 'Amanet · Kosovo', 'Software developers in Kosovo', 'Your code is your CV.', 'amanets.com/developers', 'US company · Hiring by real challenges')

# ---- jobs, in both languages ----
import urllib.request
cfg = json.load(urllib.request.urlopen('https://app.powerpolicies.com/api/referrals?roles=1', timeout=20))
jobs = ['Sales Agent', 'Sales Manager', 'Customer Support Manager', 'Executive Assistant', 'Office Receptionist',
        'Videographer', 'Content Creators', 'Social Media Manager', 'Finance / Accounting']
count = 0
for r in cfg['roles']:
    if r['title'] not in jobs: continue
    slug = r['slug']
    card(f'role-{slug}-es.jpg', 'Puesto abierto · Mérida', r.get('title_es') or r['title'], 'Postúlate hoy.', 'amanets.com/merida', 'Empresa de EE. UU. · Capacitación desde el primer día')
    card(f'role-{slug}-en.jpg', 'Open position · Mérida', r['title'], 'Apply today.', 'amanets.com/merida', 'US company · Training from day one')
    count += 2
print('role cards', count)
for f in sorted(os.listdir(OUT)): print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, 'KB')
