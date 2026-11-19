"""Build per-event landing pages for venturebuilders.fund.
Run: python3 scripts/build_event_pages.py   (writes events/<slug>.html)
Add an event by adding a dict to EVENTS. No em dashes in copy."""
import html, json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = (ROOT / "events.html").read_text()
STYLE = re.search(r"<style>(.*?)</style>", SRC, re.S).group(1)
NAV = re.search(r"(<nav>.*?<div class=\"nav-overlay\" id=\"nav-overlay\"></div>)", SRC, re.S).group(1)
FOOTER = re.search(r"(<footer>.*?</footer>)", SRC, re.S).group(1)
COOKIES = re.search(r"(  <div id=\"cookie-banner\".*?</script>\n)</body>", SRC, re.S).group(1)
GA = re.search(r"(  <!-- Google tag.*?</script>\n)", SRC, re.S).group(1)

def fix_links(s):
    # page lives one level down, so make relative links absolute
    s = re.sub(r'(href|src)="(?!https?:|/|#|mailto:)([^"]+)"', r'\1="/\2"', s)
    s = re.sub(r"(href|src)='(?!https?:|/|#|mailto:)([^']+)'", r"\1='/\2'", s)
    s = s.replace('href="#contact"', 'href="/events#contact"').replace("href='#contact'", "href='/events#contact'")
    return s

EXTRA = """
    .evp-hero{background:#0d0d0d;color:#fff;padding:9rem 2rem 4.5rem;position:relative;overflow:hidden}
    .evp-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(60% 80% at 85% 10%,rgba(232,52,78,0.22),transparent 60%)}
    .evp-hero .in{position:relative;max-width:var(--max);margin:0 auto;display:grid;gap:3rem}
    @media(min-width:960px){.evp-hero .in{grid-template-columns:1.25fr 0.75fr;align-items:end}}
    .evp-crumb{font-size:0.8rem;color:rgba(255,255,255,0.5);margin-bottom:1.25rem}
    .evp-crumb a{color:rgba(255,255,255,0.7);text-decoration:none}
    .evp-crumb a:hover{color:#fff}
    .evp-hero h1{font-family:var(--font-head);font-weight:800;font-size:clamp(2.3rem,5vw,3.6rem);line-height:1.05;letter-spacing:-0.02em;margin:0.9rem 0 1.1rem}
    .evp-hero h1 .accent{color:var(--accent)}
    .evp-sub{font-size:1.08rem;line-height:1.75;color:rgba(255,255,255,0.72);max-width:640px}
    .evp-actions{display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:2rem}
    .evp-card{background:rgba(18,18,18,0.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:1.6rem}
    .evp-card dl{display:grid;gap:1.1rem;margin:0}
    .evp-card dt{font-size:0.68rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:0.2rem}
    .evp-card dd{margin:0;font-size:0.98rem;line-height:1.5;color:#fff}
    .evp-card dd span{display:block;color:rgba(255,255,255,0.55);font-size:0.88rem}
    .evp-status{display:inline-flex;align-items:center;gap:0.5rem;font-size:0.72rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#fff;background:rgba(232,52,78,0.16);border:1px solid rgba(232,52,78,0.4);padding:0.35rem 0.75rem;border-radius:999px}
    .evp-status i{width:7px;height:7px;border-radius:50%;background:var(--accent)}
    .evp-body{max-width:760px}
    .evp-body p{color:var(--ink-mid);font-size:1.05rem;line-height:1.8;margin-bottom:1rem}
    .evp-who{display:grid;gap:1rem;margin-top:1.75rem}
    @media(min-width:700px){.evp-who{grid-template-columns:1fr 1fr}}
    .evp-who div{border-top:2px solid var(--accent);padding-top:0.8rem}
    .evp-who strong{display:block;font-family:var(--font-head);font-size:1rem;margin-bottom:0.25rem}
    .evp-who p{font-size:0.93rem;margin:0}
    .evp-logos{display:grid;gap:1rem;grid-template-columns:1fr}
    @media(min-width:700px){.evp-logos{grid-template-columns:repeat(3,1fr)}}
    .evp-logo{border:1.5px solid rgba(0,0,0,0.08);border-radius:14px;background:#fff;padding:1.5rem;display:flex;flex-direction:column;gap:1rem;align-items:flex-start;text-decoration:none;color:inherit;transition:all 250ms cubic-bezier(0.25,0,0,1)}
    .evp-logo:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(0,0,0,0.08)}
    .evp-logo .box{height:80px;display:flex;align-items:center}
    .evp-logo img{max-height:70px;max-width:180px;width:auto;display:block}
    .evp-logo .role{font-size:0.68rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent)}
    .evp-logo .nm{font-family:var(--font-head);font-weight:800;font-size:1.05rem}
    .evp-logo .ds{font-size:0.9rem;line-height:1.55;color:var(--ink-mid)}
    .evp-recap{border:2px dashed rgba(0,0,0,0.12);border-radius:16px;padding:2.5rem 2rem;text-align:center;color:var(--ink-mid)}
    .evp-recap strong{display:block;font-family:var(--font-head);font-size:1.15rem;color:var(--ink);margin-bottom:0.4rem}
    .evp-note{font-size:0.82rem;color:var(--ink-soft);margin-top:1.25rem;line-height:1.6}
"""

def logo_card(l):
    inner = (f'<div class="box"><img src="{l["img"]}" alt="{html.escape(l["name"])}" loading="lazy"></div>'
             f'<div><div class="role">{l["role"]}</div><div class="nm">{l["name"]}</div></div>'
             f'<div class="ds">{l["desc"]}</div>')
    return f'<a class="evp-logo" href="{l["url"]}" target="_blank" rel="noopener">{inner}</a>'

def page(e):
    url = f"https://venturebuilders.fund/events/{e['slug']}"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url, "url": url, "name": e["title"], "description": e["desc"],
         "isPartOf": {"@type": "WebSite", "name": "Venture Builders Fund", "url": "https://venturebuilders.fund/"},
         "breadcrumb": {"@type": "BreadcrumbList", "itemListElement": [
             {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://venturebuilders.fund/"},
             {"@type": "ListItem", "position": 2, "name": "Events", "item": "https://venturebuilders.fund/events"},
             {"@type": "ListItem", "position": 3, "name": e["crumb"], "item": url}]}}]}
    if e.get("schema_event"):
        ld["@graph"].append(e["schema_event"])
    details = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in e["details"])
    who = "".join(f"<div><strong>{a}</strong><p>{b}</p></div>" for a, b in e["who"])
    logos = "".join(logo_card(l) for l in e["logos"])
    body = "".join(f"<p>{p}</p>" for p in e["body"])
    actions = "".join(f'<a class="{c}" href="{h}"{" target=\"_blank\" rel=\"noopener\"" if h.startswith("http") else ""}>{t}</a>' for c, t, h in e["actions"])
    logos_sec = (f'''  <section class="sec" style="background:#fafafa">
    <div style="max-width:1200px;margin:0 auto">
      <div class="sec-header reveal"><p class="sec-tag">{e['logos_tag']}</p><h2 class="sec-h">{e['logos_h']}</h2></div>
      <div class="evp-logos reveal" style="margin-top:2rem">{logos}</div>
      <p class="evp-note reveal">{e.get('logos_note','')}</p>
    </div>
  </section>
''' if e["logos"] else "")
    body_note = f'<p class="evp-note">{e["body_note"]}</p>' if e.get("body_note") else ""
    hero_style = (f' style="background:linear-gradient(90deg,rgba(13,13,13,0.92) 0%,rgba(13,13,13,0.55) 45%,rgba(13,13,13,0.1) 100%),linear-gradient(to bottom,rgba(13,13,13,0) 60%,#0d0d0d 100%),url({e["hero_img"]}) right center/cover no-repeat"' if e.get("hero_img") else "")
    nav = fix_links(NAV).replace('href="/events" class="active"', 'href="/events" class="active"')
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
{GA}  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(e['title'])}</title>
  <meta name="description" content="{html.escape(e['desc'])}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Venture Builders Fund">
  <meta property="og:title" content="{html.escape(e['title'])}">
  <meta property="og:description" content="{html.escape(e['desc'])}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="https://venturebuilders.fund{e['og']}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{html.escape(e['title'])}">
  <meta name="twitter:description" content="{html.escape(e['desc'])}">
  <meta name="twitter:image" content="https://venturebuilders.fund{e['og']}">
  <script type="application/ld+json">
{json.dumps(ld, indent=2)}
  </script>
  <link rel="icon" href="/favicon.png">
  <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/gilroy-free">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/vbf.css">
  <style>{STYLE}{EXTRA}  </style>
</head>
<body>
{nav}
<main>
  <section class="evp-hero"{hero_style} aria-label="{html.escape(e['crumb'])}">
    <div class="in">
      <div>
        <div class="evp-crumb"><a href="/">Home</a> / <a href="/events">Events</a> / {e['crumb']}</div>
        <span class="evp-status"><i></i>{e['status']}</span>
        <h1>{e['h1']}</h1>
        <p class="evp-sub">{e['sub']}</p>
        <div class="evp-actions">{actions}</div>
      </div>
      <aside class="evp-card"><dl>{details}</dl></aside>
    </div>
  </section>

  <section class="sec" style="background:#fff">
    <div style="max-width:1200px;margin:0 auto">
      <div class="evp-body reveal">
        <p class="sec-tag">{e['body_tag']}</p>
        <h2 class="sec-h" style="margin-bottom:1.25rem">{e['body_h']}</h2>
        {body}
        <div class="evp-who">{who}</div>
        {body_note}
      </div>
    </div>
  </section>

{logos_sec}
  <section class="sec" style="background:#fff">
    <div style="max-width:1200px;margin:0 auto">
      <div class="evp-recap reveal"><strong>{e['recap_h']}</strong>{e['recap_p']}</div>
    </div>
  </section>

  <section class="sec contact-sec">
    <div style="max-width:900px;margin:0 auto;text-align:center" class="reveal">
      <p class="sec-tag">Sponsors and partners</p>
      <h2 class="sec-h" style="color:#fff">{e['cta_h']}</h2>
      <p style="color:rgba(255,255,255,0.7);font-size:1.02rem;line-height:1.8;margin:1rem auto 2rem;max-width:640px">{e['cta_p']}</p>
      <div class="evp-actions" style="justify-content:center"><a class="btn-primary" href="/events#contact">Talk to us about sponsoring</a><a class="btn-ghost" href="/calendar">See the 2027 calendar</a></div>
    </div>
  </section>
</main>
{fix_links(FOOTER)}
<script defer>
  (function() {{
    var btn = document.getElementById('nav-hamburger'), drawer = document.getElementById('nav-drawer'), overlay = document.getElementById('nav-overlay');
    if (!btn || !drawer || !overlay) return;
    function openMenu() {{ drawer.classList.add('open'); overlay.classList.add('open'); btn.classList.add('open'); btn.setAttribute('aria-expanded','true'); drawer.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }}
    function closeMenu() {{ drawer.classList.remove('open'); overlay.classList.remove('open'); btn.classList.remove('open'); btn.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }}
    btn.addEventListener('click', function() {{ drawer.classList.contains('open') ? closeMenu() : openMenu(); }});
    overlay.addEventListener('click', closeMenu);
    drawer.querySelectorAll('a').forEach(function(a) {{ a.addEventListener('click', closeMenu); }});
    document.addEventListener('keydown', function(e) {{ if (e.key === 'Escape') closeMenu(); }});
  }}());
  var obs = new IntersectionObserver(function(entries) {{
    entries.forEach(function(e, i) {{ if (e.isIntersecting) {{ setTimeout(function(){{ e.target.classList.add('visible'); }}, i * 80); obs.unobserve(e.target); }} }});
  }}, {{ threshold: 0.08, rootMargin: '0px 0px -40px 0px' }});
  document.querySelectorAll('.reveal').forEach(function(el){{ obs.observe(el); }});
</script>
{COOKIES}</body>
</html>
"""

VBF_LOGO = {"img": "/logo-dark.png", "name": "Venture Builders Fund", "url": "https://venturebuilders.fund/",
            "desc": "A seed-stage fund investing behind founders referred by startup ecosystem leaders."}

EVENTS = [
 {"slug": "cheyenne-2027", "crumb": "Cheyenne, January 2027", "status": "Invitation only",
  "hero_img": "/images/events/cheyenne-metropolitan.jpg",
  "title": "Venture Builders | gBETA Wyoming luncheon, Cheyenne, January 27, 2027",
  "desc": "A private, seated lunch in Cheyenne, Wyoming for founders, accelerator leaders and investors, hosted by Venture Builders Fund with accelerator partner gBETA Wyoming and lunch sponsored by Wells Fargo.",
  "h1": 'Venture Builders <span class="accent">|</span> gBETA Wyoming luncheon',
  "sub": "Venture Builders Fund is hosting a private lunch in downtown Cheyenne with our accelerator partner, gener8tor's gBETA Wyoming, bringing founders, accelerator and ecosystem leaders and active investors around one table. No script and no pitches, just good conversation.",
  "actions": [("btn-primary", "Sponsor this lunch", "/events#contact"), ("btn-ghost", "See the 2027 calendar", "/calendar")],
  "details": [("When", "Wednesday, January 27, 2027<span>11:30 AM to 1:00 PM MST</span>"),
              ("Where", "The Metropolitan Downtown<span>1701 Carey Ave, Cheyenne, WY 82001</span>"),
              ("Format", "Reception, then a seated lunch<span>18 seats, by invitation only</span>"),
              ("Host", "Steve Hayton<span>General Partner, Venture Builders Fund</span>"),
              ("Accelerator partner", "Baylie Evans<span>Managing Director, gBETA Wyoming</span>")],
  "body_tag": "The afternoon", "body_h": "One table, the right people",
  "body": ["We start with a short reception at The Metropolitan, then sit down together for lunch. Every seat is planned by hand, and over coffee we move seats so everyone leaves having met someone new.",
           "The room is kept small on purpose, so founders get real time with the investors and partners who can help them grow. Seats are by invitation only."],
  "who": [("Founders", "From the current gBETA Wyoming cohort, plus program alumni."),
          ("Ecosystem leaders", "The gBETA Wyoming team and the accelerator and ecosystem builders around it."),
          ("Corporate partners", "A small number of partners who back Wyoming's founders."),
          ("Investors", "The Venture Builders Fund team and active investors.")],
  "logos_tag": "Host, partner and sponsor", "logos_h": "Who's making it happen",
  "logos": [dict(VBF_LOGO, role="Host"),
            {"img": "/images/events/logos/gbeta.png", "name": "gBETA Wyoming", "role": "Accelerator partner", "url": "https://www.gener8tor.com/gbeta",
             "desc": "gener8tor's free, no-equity accelerator for early-stage companies with local roots."},
            {"img": "/images/events/sponsor-wells-fargo.png", "name": "Wells Fargo", "role": "Lunch sponsor", "url": "https://www.wellsfargo.com/",
             "desc": "Our lunch sponsor for the afternoon."}],
  "recap_h": "Photos from the lunch will be shared here",
  "recap_p": "After January 27, this page becomes a recap of the afternoon, with photos and highlights.",
  "cta_h": "Want your company at the table?",
  "cta_p": "Every Venture Builders lunch and dinner is open to sponsors. Put your team in a room of founders, accelerator leaders and investors, with no red tape.",
  "og": "/images/events/og/cheyenne-2027.png", "og_bg": "/images/events/cheyenne-metropolitan.jpg", "og_lines": ("Venture Builders | gBETA Wyoming luncheon", "Cheyenne, WY  ·  January 27, 2027", "Hosted by Venture Builders Fund  ·  Lunch sponsored by Wells Fargo"),
  "schema_event": {"@type": "Event", "name": "Venture Builders | gBETA Wyoming luncheon",
      "startDate": "2027-01-27T11:30:00-07:00", "endDate": "2027-01-27T13:00:00-07:00",
      "eventStatus": "https://schema.org/EventScheduled", "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "description": "A private, seated lunch for founders, accelerator leaders and investors, by invitation only, hosted by Venture Builders Fund with accelerator partner gBETA Wyoming.",
      "image": "https://venturebuilders.fund/images/events/og/cheyenne-2027.png",
      "location": {"@type": "Place", "name": "The Metropolitan Downtown", "address": {"@type": "PostalAddress", "streetAddress": "1701 Carey Ave", "addressLocality": "Cheyenne", "addressRegion": "WY", "postalCode": "82001", "addressCountry": "US"}},
      "organizer": {"@type": "Organization", "name": "Venture Builders Fund", "url": "https://venturebuilders.fund/"},
      "sponsor": {"@type": "Organization", "name": "Wells Fargo", "url": "https://www.wellsfargo.com/"},
      "isAccessibleForFree": True}},
 {"slug": "whitefish-2027", "crumb": "Whitefish, February 2027", "status": "Sponsor opportunity",
  "title": "Venture Builders dinner at the Whitefish Security Summit, February 2027",
  "desc": "Venture Builders Fund is planning a private dinner in Whitefish, Montana during the Whitefish Security Summit, February 24 to 26, 2027, for defense founders, investors and government innovation funders. The dinner is open to a sponsor.",
  "h1": 'A Venture Builders dinner at the <span class="accent">Whitefish Security Summit</span>',
  "sub": "We'll be in Whitefish, Montana for the second annual Whitefish Security Summit, where the 2027 focus is autonomous warfare meeting artificial intelligence. While we're there, we're planning a private dinner for defense founders, investors and government innovation funders, and we're looking for a sponsor to host the room with us.",
  "actions": [("btn-primary", "Sponsor the Whitefish dinner", "/events#contact"), ("btn-ghost", "About the summit", "https://whitefishsecuritysummit.com")],
  "details": [("When", "During the summit<span>February 24 to 26, 2027</span>"),
              ("Where", "Whitefish, Montana<span>Venue to be confirmed</span>"),
              ("Format", "A private, seated dinner<span>By invitation, around 20 seats</span>"),
              ("Summit focus", "Autonomous warfare meets artificial intelligence")],
  "body_tag": "The dinner", "body_h": "Defense founders, investors and buyers at one table",
  "body": ["Founders building for national security face a hard path: long sales cycles, a small set of buyers and investors who don't always know the space. The Whitefish Security Summit brings practitioners, technologists and funders together for three days, and our dinner puts the right people from that week around one table.",
           "As with every Venture Builders dinner, seats are planned by hand, conversations are seeded, and our sponsor is part of the evening, not just a logo on the menu. The sponsor receives the guest list ahead of the night and introductions to follow up on."],
  "who": [("Defense and dual-use founders", "Especially those coming out of accelerators and looking for their first large customer."),
          ("Government innovation funders", "Programs that invest in and buy from early-stage defense companies, in the US and allied countries."),
          ("Investors", "Funds and angels active in national security and dual-use technology."),
          ("Our sponsor", "One company hosting the room with us and meeting every guest.")],
  "logos": [],
  "body_note": "The Whitefish Security Summit is run in partnership with the Lobo Institute. Venture Builders Fund is attending the summit and hosting this dinner independently; we are not an organizer of the summit.",
  "recap_h": "Photos from Whitefish will be shared here",
  "recap_p": "After the summit, this page becomes a recap of the dinner, with photos and highlights.",
  "cta_h": "Host the Whitefish dinner with us",
  "cta_p": "Put your company in front of defense founders, investors and government funders while they're all in one place. One sponsor, one room, no red tape.",
  "og": "/images/events/og/whitefish-2027.png", "og_lines": ("A Venture Builders dinner at the Whitefish Security Summit", "Whitefish, MT  ·  February 2027", "Sponsor opportunity")},
]

if __name__ == "__main__":
    (ROOT / "events").mkdir(exist_ok=True)
    for e in EVENTS:
        out = page(e)
        assert "—" not in out.split("</style>")[1], "em dash found"
        (ROOT / "events" / f"{e['slug']}.html").write_text(out)
        print("wrote", e["slug"])
