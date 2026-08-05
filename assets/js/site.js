/* ===========================================================================
   SCIPL — BEHAVIOUR
   One file, no framework, no build step. Content comes from the generated
   bundles in data/ ; nothing here is hand-authored copy about a project.
   =========================================================================== */
(() => {
'use strict';

const D  = window.SCIPL || { projects: [], sectors: [], cities: [], scopes: [] };
const HERO  = window.SCIPL_HERO  || [];
const LOGOS = window.SCIPL_LOGOS || [];

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const page = document.body.dataset.page;

const reduced = () =>
  document.documentElement.dataset.motion === 'off' ||
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ?qa=1 — the screenshot rig's switch. Suppresses the two things that are
   deliberately in front of the page for a moment on a real visit (the intro and
   the transition veil) so a headless capture is of the page itself and is
   deterministic. Nothing else about the build changes. */
const QA = new URLSearchParams(location.search).get('qa') === '1';
/* &y=<px> scrolls the capture to a fixed offset, so a band further down the page
   can be photographed without driving a real browser. */
if (QA){
  const q = new URLSearchParams(location.search);
  const y = Number(q.get('y'));
  if (y > 0) addEventListener('load', () => setTimeout(() => scrollTo(0, y), 60));
  // &menu=1 photographs the navigation open, which is otherwise unreachable
  // from a headless capture
  if (q.get('menu') === '1')
    addEventListener('load', () => setTimeout(() => {
      const b = document.querySelector('.burger');
      if (b) b.click();
    }, 80));
}

/* =============================================================== UNITS ==== */
/* ⭐ Areas are now a PROJECT-PAGE concern only. The client was explicit that
   measurements should not appear on pages that are not describing a project, so
   the global header switch is gone and cards no longer carry a figure. The
   preference still persists — it just has one place to be set. */
const SQM = 0.09290304;
let units = localStorage.getItem('scipl.units') || 'sqft';
const fmt = n => n.toLocaleString('en-IN');
const areaText = sqft => !sqft ? '—'
  : units === 'sqm' ? fmt(Math.round(sqft * SQM)) + ' sq m'
                    : fmt(sqft) + ' sq ft';

function renderAreas(){
  $$('[data-sqft]').forEach(el => el.textContent = areaText(Number(el.dataset.sqft)));
  $$('.units [data-val]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.val === units)));
}

/* ================================================== AWAITING-CONTENT MARK = */
/* Fields SCIPL still owes us arrive from the generator prefixed "~". They are
   never silently rendered as fact. */
function val(v){
  if (typeof v === 'string' && v.startsWith('~'))
    return `<span class="awaiting" title="Placeholder — awaiting content from SCIPL">${v.slice(1)}</span>`;
  return v == null ? '—' : String(v);
}

/* ============================================================= PICTURES === */
function picture(dir, img, sizes, opts = {}){
  const { eager = false, alt = '', cls = '' } = opts;
  const base = `assets/${dir}/${img.stem}`;
  const webp = img.variants.map(v => `${base}-${v.w}.webp ${v.w}w`).join(', ');
  const jpeg = img.variants.map(v => `${base}-${v.w}.jpg ${v.w}w`).join(', ');
  const last = img.variants[img.variants.length - 1];
  return `<picture class="${cls}">
    <source type="image/webp" srcset="${webp}" sizes="${sizes}">
    <img src="${base}-${last.w}.jpg" srcset="${jpeg}" sizes="${sizes}"
         width="${last.w}" height="${last.h}" alt="${alt}"
         loading="${eager ? 'eager' : 'lazy'}"${eager ? ' fetchpriority="high"' : ''} decoding="async">
  </picture>`;
}
const pPic = (p, img, sizes, opts) => picture(`img/${p.slug}`, img, sizes, opts);

function watchImages(root = document){
  $$('img', root).forEach(im => {
    if (im.complete && im.naturalWidth) im.classList.add('is-loaded');
    else im.addEventListener('load', () => im.classList.add('is-loaded'), { once: true });
  });
}

/* ===================================================== PROJECT HELPERS ==== */
const NAMES = window.SCIPL_NAMES || {};

const heroes  = () => D.projects.filter(p => p.grade === 'hero');
const imgOf   = (p, stem) => p.images.find(i => i.stem === stem) || p.images[0];
const heroImg = p => imgOf(p, p.hero);

/* Client name as it should read — see data/corrections.js. */
const clientOf = p => NAMES[p.client] || p.client;

/* ⭐ Place, normalised. The deck writes the same idea three ways — "Hennur
   Bangalore", "Sarjapur, Bangalore", "Bangalore" — and `city` throws the
   locality away entirely, which made four different Sparsh Hospital sites
   render as four identical cards. This keeps the locality and punctuates it
   the same way every time. Nothing is invented; the words are the deck's. */
function placeOf(p){
  const city = (p.city || '').trim();
  const loc  = (p.location || '').trim();
  if (!loc) return city;
  if (!city) return loc;
  const esc = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const locality = loc.replace(new RegExp('[,\\s]*' + esc + '\\s*$', 'i'), '')
                      .replace(/[,\s]+$/, '').trim();
  return locality ? `${locality}, ${city}` : city;
}

const altFor = (p, i = 0) =>
  `${clientOf(p)}, ${placeOf(p)} — interior fit-out by SCIPL${i ? ' (view ' + (i + 1) + ')' : ''}`;

const ARROW = `<svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
  <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" stroke-width="1.4"/></svg>`;

/* Minimal iconography — one small stroke path each, no icon font/library. */
const ICON = {
  pin: `<svg class="ico" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 15S3 10.5 3 6.6A5 5 0 0 1 13 6.6C13 10.5 8 15 8 15z" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="6.5" r="1.8" stroke="currentColor" stroke-width="1.3"/></svg>`,
  area: `<svg class="ico" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1 1h4M1 1v4M15 1h-4M15 1v4M1 15h4M1 15v-4M15 15h-4M15 15v-4" stroke="currentColor" stroke-width="1.3"/></svg>`,
  sector: `<svg class="ico" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 15V4l4-2 4 2v11M10 15V7l4-1v9" stroke="currentColor" stroke-width="1.3"/></svg>`,
  status: `<svg class="ico" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.3"/><path d="M5.3 8.3l1.8 1.8 3.6-4" stroke="currentColor" stroke-width="1.3"/></svg>`,
  client: `<svg class="ico" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="5.3" r="2.6" stroke="currentColor" stroke-width="1.3"/><path d="M2.5 14c.9-3 3-4.4 5.5-4.4s4.6 1.4 5.5 4.4" stroke="currentColor" stroke-width="1.3"/></svg>`,
};

/* A card carries client, place and sector. No area — see the note on units. */
function cardHTML(p, sizes, extra = ''){
  return `<a class="card rv" href="project.html?p=${p.slug}" data-nav ${extra}>
    <span class="card__fig">${pPic(p, heroImg(p), sizes, { alt: altFor(p) })}</span>
    <span class="card__body">
      <span class="card__client">${clientOf(p)}</span>
      <span class="card__line">${ICON.pin}${placeOf(p)} · ${p.sector}</span>
    </span>
  </a>`;
}

function plateHTML(p, i){
  return `<a class="plate rv" href="project.html?p=${p.slug}" data-nav>
    <span class="plate__fig">
      <span class="plate__i">${String(i + 1).padStart(2, '0')}</span>
      ${pPic(p, heroImg(p), '100vw', { alt: altFor(p) })}
    </span>
    <span class="plate__body">
      <span class="plate__name">
        <h3>${clientOf(p)}</h3>
        <span class="plate__line">${ICON.pin}${placeOf(p)} · ${p.sector}</span>
      </span>
      <span class="plate__go">View project ${ARROW}</span>
    </span>
  </a>`;
}

/* ============================================================== HEADER ==== */
(function header(){
  const hdr = $('.hdr');
  if (!hdr) return;
  const overHero = document.body.dataset.overhero === 'true';
  let last = 0;

  const onScroll = () => {
    const y = scrollY;
    const heroH = overHero ? (($('.hero') || {}).offsetHeight || 0) - 120 : 0;
    hdr.classList.toggle('is-stuck', y > 40 && !(overHero && y < heroH));
    hdr.classList.toggle('is-over', overHero && y < heroH);
    hdr.classList.toggle('is-hidden',
      y > 360 && y > last && !document.body.classList.contains('menu-open'));
    last = y;
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
})();

/* ================================================================ MENU ==== */
/* The only navigation, at every width. Every entry is a standalone page — the
   client's note was that these used to drop to a section of an over-long
   homepage. Hovering an entry swaps the plate beside it. */
(function menu(){
  const burger = $('.burger'), menu = $('.menu');
  if (!burger || !menu) return;

  const links = $$('.menu__list a', menu);
  const view  = $('.menu__view', menu);

  const here = location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });

  /* ⭐ The preview plates are six full photographs. Preloading them at page load
     cost half a megabyte on every page for images nobody has asked to see — the
     menu has not been opened yet. They are built on the FIRST open instead; the
     panel takes 900ms to wipe down, which is more than enough for the first one
     to decode. */
  let previewsBuilt = false;
  function buildPreviews(){
    if (previewsBuilt || !view) return;
    previewsBuilt = true;
    links.forEach((a, i) => {
      const src = a.dataset.view;
      if (!src) return;
      const im = new Image();
      im.src = src;
      im.alt = '';
      im.decoding = 'async';
      if (i === 0) im.classList.add('is-on');
      view.appendChild(im);
      a.addEventListener('mouseenter', () => {
        $$('img', view).forEach(x => x.classList.remove('is-on'));
        im.classList.add('is-on');
      });
    });
  }

  const setOpen = open => {
    if (open) buildPreviews();
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    // the panel is only hidden visually (by clip-path), so it has to be taken
    // out of the tab order and the accessibility tree explicitly
    if (open) menu.removeAttribute('inert');
    else menu.setAttribute('inert', '');
    // items arrive out of their own mask, 55ms apart, after the panel has cleared
    links.forEach((a, i) =>
      a.style.transitionDelay = open ? (240 + i * 55) + 'ms' : '0ms');
    if (window.SCIPLLenis) open ? window.SCIPLLenis.stop() : window.SCIPLLenis.start();
  };

  burger.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setOpen(false);
  });
  setOpen(false);
})();

/* ==================================================== PAGE TRANSITIONS ==== */
/* A maroon field wipes down over the page being left and off the page arriving.
   A cross-fade reads as a slow repaint; a moving field reads as one document
   giving way to another. */
(function transitions(){
  if (QA) return;

  const veil = document.createElement('div');
  veil.className = 'pt is-in';
  veil.setAttribute('aria-hidden', 'true');
  document.body.appendChild(veil);

  // arriving: the field is already covering, and clears downward
  requestAnimationFrame(() => {
    veil.classList.remove('is-in');
    veil.classList.add('is-out');
  });
  // ⭐ It must never survive a stalled frame loop. The classes above are driven
  // by rAF and a CSS transition, and both can stall; this sets the final
  // transform outright, so the worst case is the veil snapping away rather than
  // a maroon rectangle sitting over the page.
  setTimeout(() => {
    veil.classList.remove('is-in');
    veil.classList.add('is-out');
    veil.style.transition = 'none';
    veil.style.transform = 'translateY(100%)';
  }, 1200);

  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-nav]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    if (reduced()){ location.href = url.href; return; }
    veil.classList.remove('is-out');
    veil.classList.add('is-in');
    setTimeout(() => location.href = url.href, 560);
  });
  addEventListener('pageshow', e => {
    if (e.persisted){ veil.classList.remove('is-in'); veil.classList.add('is-out'); }
  });
})();

/* ================================================================ HERO ==== */
/* Auto-advancing, four frames. Slides do not cross-fade: the incoming frame is
   uncovered by an edge travelling across the outgoing one, which keeps the same
   vocabulary as every other reveal on the site.

   ⭐ Two of the four carry a motion version of the same shot. The still is
   always built first and stays as the poster; the clip is attached only when its
   slide is about to be seen, and fades over the top once it can actually play.
   So the hero is never waiting on a video, a slow connection simply sees the
   photograph, and only one clip is ever decoding at a time. */
function buildHero(){
  const stage = $('.hero__stage');
  if (!stage || !HERO.length) return;

  const ticks = $('.hero__ticks'), cap = $('.hero__cap'), count = $('.hero__count');

  const slideHTML = (s, i) =>
    picture('hero', s, '100vw', { eager: i === 0, alt: `${s.client}, ${s.city} — ${s.caption}` });

  /* Attach (once) and play the clip belonging to a slide. */
  function motion(el, s){
    if (!s.video || reduced()) return;
    let v = $('video', el);
    if (!v){
      v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('muted', '');           // Safari wants the attribute too
      v.setAttribute('playsinline', '');
      v.preload = 'auto';
      v.setAttribute('aria-hidden', 'true');
      v.addEventListener('canplay', () => v.classList.add('is-on'), { once: true });
      v.src = s.video;
      el.appendChild(v);
    }
    const p = v.play();
    if (p && p.catch) p.catch(() => {});      // autoplay refused: the still stands
  }
  function stopMotion(el){
    const v = $('video', el);
    if (v) v.pause();
  }

  /* ⭐ Only the opening plate is fetched with the page. The other three are
     inside the viewport from the first frame, so `loading="lazy"` does nothing
     for them — the browser fetches all four and the first view costs three
     photographs nobody has seen yet. They are injected once the page has
     loaded, which is still many seconds before the first slide change. */
  stage.innerHTML = HERO.map((s, i) => `
    <div class="hero__slide${i === 0 ? ' is-live' : ''}" data-i="${i}" aria-hidden="${i ? 'true' : 'false'}">
      ${i === 0 ? slideHTML(s, 0) : ''}
    </div>`).join('');

  const hydrate = () => {
    $$('.hero__slide', stage).forEach((el, i) => {
      if (i > 0 && !el.children.length) el.innerHTML = slideHTML(HERO[i], i);
    });
    watchImages(stage);
    motion($('.hero__slide', stage), HERO[0]);   // the opening clip, after load
  };
  if (document.readyState === 'complete') setTimeout(hydrate, 200);
  else addEventListener('load', () => setTimeout(hydrate, 200), { once: true });

  if (ticks) ticks.innerHTML = HERO.map((_, i) =>
    `<button class="hero__tick${i === 0 ? ' is-done' : ''}" data-i="${i}"
       aria-label="Show frame ${i + 1}"><i></i></button>`).join('');

  const paint = i => {
    const s = HERO[i];
    if (cap) cap.innerHTML = `<b>${s.client}, ${s.city}</b><span>${s.caption}</span>`;
    if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(HERO.length).padStart(2, '0')}`;
    $$('.hero__tick', ticks).forEach((t, n) => t.classList.toggle('is-done', n <= i));
  };

  let cur = 0, timer = null;
  const HOLD = 5600;

  /* ⭐ The outgoing plate stays fully painted UNDERNEATH for the whole wipe, and
     is only parked once the incoming one is known to be covering the frame. The
     obvious version — reveal the new slide, hide the old one on a timer — has a
     failure mode where a stalled clip-path transition leaves both clipped and
     the hero goes black. Same rule as the motion watchdog: a stalled effect may
     cost the animation, never the content. */
  function go(next){
    if (next === cur) return;
    const slides = $$('.hero__slide', stage);
    const from = slides[cur], to = slides[next];
    const forward = next > cur || (cur === HERO.length - 1 && next === 0);

    from.style.zIndex = '1';
    from.style.transition = 'none';
    from.style.clipPath = 'inset(0 0 0 0)';

    to.style.zIndex = '2';
    to.style.transition = 'none';
    to.style.clipPath = forward ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
    to.classList.add('is-live');
    to.setAttribute('aria-hidden', 'false');
    void to.offsetWidth;                   // commit the parked state
    to.style.transition = 'clip-path 1100ms cubic-bezier(0.76,0,0.24,1)';
    to.style.clipPath = 'inset(0 0 0 0)';

    // only the frame on screen decodes video; the one leaving stops
    motion(to, HERO[next]);
    stopMotion(from);

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      to.style.transition = 'none';        // force the arrival before parking
      to.style.clipPath = 'inset(0 0 0 0)';
      from.classList.remove('is-live');
      from.setAttribute('aria-hidden', 'true');
      from.style.zIndex = '';
      from.style.clipPath = 'inset(0 0 0 100%)';
    };
    to.addEventListener('transitionend', settle, { once: true });
    setTimeout(settle, 1400);

    cur = next;
    paint(cur);
  }

  const advance = () => go((cur + 1) % HERO.length);
  const step = d => { go((cur + d + HERO.length) % HERO.length); restart(); };
  const restart = () => { clearInterval(timer); timer = setInterval(advance, HOLD); };

  paint(0);

  // arrows work whether or not the carousel is advancing itself, so they are
  // wired outside the reduced-motion check
  const prev = $('.hero__arrow--prev'), next = $('.hero__arrow--next');
  if (prev) prev.addEventListener('click', () => step(-1));
  if (next) next.addEventListener('click', () => step(1));
  addEventListener('keydown', e => {
    if (!$('.hero') || document.body.classList.contains('menu-open')) return;
    if (scrollY > (($('.hero') || {}).offsetHeight || 0)) return;   // only while the hero is on screen
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft')  step(-1);
  });

  if (!reduced()){
    timer = setInterval(advance, HOLD);
    $$('.hero__tick', ticks).forEach(t =>
      t.addEventListener('click', () => { go(Number(t.dataset.i)); restart(); }));

    // do not keep advancing behind a hidden tab, and do not queue up a burst
    document.addEventListener('visibilitychange', () =>
      document.hidden ? clearInterval(timer) : restart());

    // drag / swipe
    let x0 = null;
    stage.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    stage.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 48){ go((cur + (dx < 0 ? 1 : HERO.length - 1)) % HERO.length); restart(); }
      x0 = null;
    });
  }
  watchImages(stage);
}

/* ============================================================== LOGOS ===== */
/* ⭐ Real logos, at last. tools/build_logos.py recovers 50 of them from the two
   flattened walls in the deck. They are ~113px rasters and are used at a size
   they can hold; vector originals remain on the ask list. */
function buildLogos(){
  // Jet Airways is in the deck and has ceased operations — an open question with
  // the client, so it is held out rather than quietly shown as current.
  const list = LOGOS.filter(l => !l.questioned);
  if (!list.length) return;

  const img = l => `<img src="assets/logos/${l.slug}.png" alt="${l.name}" loading="lazy" decoding="async">`;

  /* ⭐ Forty-nine separate files is forty-nine requests, and on the homepage the
     strip sits above the fold of a tall page — `loading="lazy"` will not save
     it. Build the markup only when the band is close to being seen. Vector
     originals from SCIPL would collapse this to one sprite; until then this is
     the honest fix. */
  const build = (host, html) => {
    if (!host || host.dataset.built) return;
    const go = () => { host.dataset.built = '1'; host.innerHTML = html;
                       if (window.SCIPLMotion && window.SCIPLMotion.ok) window.SCIPLMotion.logos(); };
    if (!('IntersectionObserver' in window)) return go();
    const io = new IntersectionObserver(en => {
      if (en[0].isIntersecting){ io.disconnect(); go(); }
    }, { rootMargin: '600px 0px' });
    io.observe(host.closest('.logos') || host);
  };

  build($('.logos__row'), list.map(img).join(''));
  build($('.logos--grid'), list.map(l => `<div>${img(l)}</div>`).join(''));
}

/* ============================================================ LIGHTBOX ==== */
const Lightbox = (() => {
  let items = [], idx = 0, el = null;
  function build(){
    el = document.createElement('div');
    el.className = 'lb';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <button class="lb__x" aria-label="Close">&times;</button>
      <button class="lb__nav lb__prev" aria-label="Previous">&#8249;</button>
      <img alt="">
      <button class="lb__nav lb__next" aria-label="Next">&#8250;</button>
      <div class="lb__bar"><span class="lb__cap"></span><span class="lb__n"></span></div>`;
    document.body.appendChild(el);
    $('.lb__x', el).onclick = close;
    $('.lb__prev', el).onclick = () => go(-1);
    $('.lb__next', el).onclick = () => go(1);
    el.addEventListener('click', e => { if (e.target === el) close(); });
    let x0 = null;
    el.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    el.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 46) go(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }
  function paint(){
    const it = items[idx];
    $('img', el).src = it.src;
    $('img', el).alt = it.alt;
    $('.lb__cap', el).textContent = it.cap || '';
    $('.lb__n', el).textContent = `${idx + 1} / ${items.length}`;
  }
  function go(d){ idx = (idx + d + items.length) % items.length; paint(); }
  function close(){ el.classList.remove('is-open'); document.body.classList.remove('is-locked'); }
  function open(list, i){
    if (!el) build();
    items = list; idx = i; paint();
    el.classList.add('is-open');
    document.body.classList.add('is-locked');
    $('.lb__x', el).focus();
  }
  addEventListener('keydown', e => {
    if (!el || !el.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
  return { open };
})();

/* ================================================================ HOME ==== */
function renderHome(){
  buildHero();
  buildLogos();

  /* ⭐ Selected work is ONE full-width plate and three cards, not the portfolio
     and not four stacked plates. The note was that the homepage ran too long:
     four full-bleed 16:9 bands are about 2,400px of scrolling on their own, and
     they give the section no rhythm either. One anchor plus a row reads as an
     edit, costs less than half the height, and the work index is one click away
     for anyone who wants to browse. */
  const sel = heroes().slice(0, 4);
  const pl = $('#plates');
  if (pl && sel.length) pl.innerHTML =
    plateHTML(sel[0], 0) +
    `<div class="grid grid--3" style="margin-top:var(--space-2)">` +
    sel.slice(1, 4).map(p => cardHTML(p, '(max-width:900px) 100vw, 30vw')).join('') +
    `</div>`;

  watchImages();
}

/* Sector rows appear on both the homepage and the sectors page, and the counts
   are computed from the real portfolio so they cannot drift from it. */
function renderSectorRows(){
  const sc = $('#sectorrows');
  if (!sc) return;
  sc.innerHTML = D.sectors.map((s, i) => {
    const n = D.projects.filter(p => p.sector === s).length;
    return `<a class="row rv" href="work.html?sector=${encodeURIComponent(s)}" data-nav>
      <span class="row__n">${String(i + 1).padStart(2, '0')}</span>
      <span class="row__t"><h4>${s}</h4></span>
      <span class="row__x">${n} project${n > 1 ? 's' : ''}</span>
    </a>`;
  }).join('');
}

/* ================================================================ WORK ==== */
/* Spelled out reads better than a numeral at display size, and the portfolio is
   never going to reach a size where this stops being worth it. Above the table
   it falls back to the figure rather than inventing English. */
const WORDS = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen',
  'Twenty','Twenty-one','Twenty-two','Twenty-three','Twenty-four','Twenty-five','Twenty-six',
  'Twenty-seven','Twenty-eight','Twenty-nine','Thirty'];

function renderWork(){
  const grid = $('#workgrid');
  if (!grid) return;

  const n = D.projects.length;
  const title = $('#work-title');
  if (title) title.textContent = `${WORDS[n] || n} project${n === 1 ? '' : 's'}.`;

  const selSector = $('#f-sector'), selCity = $('#f-city'), selScope = $('#f-scope');
  selSector.innerHTML = `<option value="">All sectors</option>` + D.sectors.map(s => `<option>${s}</option>`).join('');
  selCity.innerHTML   = `<option value="">All cities</option>`   + D.cities.map(s => `<option>${s}</option>`).join('');
  selScope.innerHTML  = `<option value="">All capabilities</option>` + D.scopes.map(s => `<option>${s}</option>`).join('');

  grid.innerHTML = D.projects.map(p => cardHTML(p,
    '(max-width:900px) 100vw, (max-width:1180px) 46vw, 30vw',
    `data-sector="${p.sector}" data-city="${p.city}" data-scope="${p.scope.join('|')}"`)).join('');

  const q = new URLSearchParams(location.search);
  selSector.value = q.get('sector') || '';
  selCity.value   = q.get('city')   || '';
  selScope.value  = q.get('scope')  || '';

  function apply(pushUrl = true){
    const s = selSector.value, c = selCity.value, sc = selScope.value;
    const cards = $$('.card', grid);
    // FLIP: measure, change, measure, invert, play — the remaining cards glide
    // into their new positions rather than jumping.
    const first = new Map(cards.map(el => [el, el.getBoundingClientRect()]));

    let n = 0;
    cards.forEach(el => {
      const ok = (!s || el.dataset.sector === s)
              && (!c || el.dataset.city === c)
              && (!sc || el.dataset.scope.split('|').includes(sc));
      el.hidden = !ok;
      el.classList.toggle('is-out', !ok);
      if (ok) n++;
    });
    $('#count').textContent = `${n} of ${D.projects.length} projects`;

    if (!reduced()) cards.forEach(el => {
      if (el.hidden) return;
      const a = first.get(el), b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) return;
      el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }],
        { duration: 460, easing: 'cubic-bezier(.16,1,.3,1)' });
    });

    if (pushUrl){
      const p = new URLSearchParams();
      if (s) p.set('sector', s);
      if (c) p.set('city', c);
      if (sc) p.set('scope', sc);
      history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
    }
    if (window.SCIPLMotion && window.SCIPLMotion.ok) window.SCIPLMotion.refresh();
  }

  [selSector, selCity, selScope].forEach(el => el.addEventListener('change', () => apply()));
  $('#reset').addEventListener('click', () => {
    selSector.value = selCity.value = selScope.value = '';
    apply();
  });

  apply(false);
  watchImages();
}

/* ============================================================= PROJECT ==== */
function renderProject(){
  const slug = new URLSearchParams(location.search).get('p');
  const p = D.projects.find(x => x.slug === slug) || heroes()[0];
  if (!p) return;
  document.title = `${clientOf(p)}, ${placeOf(p)} — SCIPL`;

  const media = $('.ph__media');
  if (media) media.innerHTML = pPic(p, heroImg(p), '100vw', { eager: true, alt: altFor(p) });

  $('#p-client').textContent = clientOf(p);
  $('#p-eyebrow').textContent = `${p.sector} · ${placeOf(p)}`;

  $('#p-facts').innerHTML = `
    <dl>
      <dt>${ICON.client}Client</dt><dd>${clientOf(p)}</dd>
      <dt>${ICON.pin}Location</dt><dd>${placeOf(p)}</dd>
      <dt>${ICON.area}Area</dt><dd><span data-sqft="${p.area_sqft || ''}"></span></dd>
      <dt>${ICON.sector}Sector</dt><dd>${p.sector}</dd>
      <dt>${ICON.status}Status</dt><dd>${val(p.status)}</dd>
    </dl>
    <div class="units" role="group" aria-label="Area units">
      <button data-val="sqft">sq ft</button><button data-val="sqm">sq m</button>
    </div>`;

  $$('.units [data-val]').forEach(b => b.addEventListener('click', () => {
    units = b.dataset.val;
    localStorage.setItem('scipl.units', units);
    renderAreas();
  }));

  const shots = p.images.filter(i => i.stem !== p.hero);
  const items = shots.map((i, n) => ({
    src: `assets/img/${p.slug}/${i.stem}-${i.variants[i.variants.length - 1].w}.jpg`,
    alt: altFor(p, n), cap: `${clientOf(p)}, ${placeOf(p)}`,
  }));
  $('#p-gallery').innerHTML = shots.map((i, n) =>
    `<button type="button" data-i="${n}" aria-label="Enlarge photograph ${n + 1}">
      ${pPic(p, i, '(max-width:560px) 50vw, 240px', { alt: altFor(p, n) })}</button>`).join('');
  $$('#p-gallery button').forEach(b =>
    b.addEventListener('click', () => Lightbox.open(items, Number(b.dataset.i))));

  const idx = D.projects.findIndex(x => x.slug === p.slug);
  const nx = D.projects[(idx + 1) % D.projects.length];
  $('#p-next').innerHTML = plateHTML(nx, idx + 1).replace('plate rv', 'plate rv');
  $('#p-next-label').textContent = 'Next project';

  watchImages();
}

/* ================================================================= BOOT === */
if (page === 'home')    renderHome();
if (page === 'work')    renderWork();
if (page === 'project') renderProject();
renderSectorRows();
if (page !== 'home') buildLogos();

renderAreas();
watchImages();
$$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
// any "All N projects" in the copy comes from the portfolio, never a typed number
$$('[data-total]').forEach(el => el.textContent = D.projects.length);

if (window.SCIPLMotion && window.SCIPLMotion.ok){
  window.SCIPLMotion.boot();
} else {
  // no motion stack: nothing is allowed to stay hidden
  $$('.rv, .rv-stagger, .sec-head').forEach(el => el.classList.add('is-in'));
}
setTimeout(watchImages, 140);

})();
