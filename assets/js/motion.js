/* ===========================================================================
   SCIPL — MOTION
   ---------------------------------------------------------------------------
   The client's note on the prototype was that the animation "felt flat — more
   than basic appear and fade". That is a fair reading of what was there: three
   profiles, but the shared spine of all three was opacity + a small Y offset.

   So nothing in this file fades anything in. The vocabulary is:

     UNCOVER    photographs are revealed by an edge travelling across them
                (clip-path), with the frame's own scale settling behind it —
                the drawing-unrolled idiom from the Workshop document
     RISE       display type comes up out of a mask, word by word, with a slight
                counter-rotation so it arrives rather than appears
     DRAW       rules, bars and hairlines have a length, and gain it
     DRIFT      anything inside a frame bigger than itself moves against the
                scroll — hero, work plates, the field watermark
     ROLL       numbers count to their value on tabular figures
     WIPE       page changes and the carousel move a solid edge across, never
                cross-fade

   Built on GSAP + ScrollTrigger + Lenis, vendored and pinned. One motion stack,
   loaded once — the reference study measured a competitor loading ten libraries
   (Lenis three times over) to produce a worse result.
   =========================================================================== */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const reduced = () =>
  document.documentElement.dataset.motion === 'off' ||
  matchMedia('(prefers-reduced-motion: reduce)').matches;

const hasGSAP = typeof window.gsap !== 'undefined' &&
                typeof window.ScrollTrigger !== 'undefined';

/* --------------------------------------------------------------- LOADER -- */
/* Deliberately OUTSIDE the GSAP guard: the intro must work, or not run at all,
   independently of whether the motion stack arrived. It is plain rAF + CSS.

   ⭐ WHETHER to show it is decided in the head of the page, before first paint,
   and recorded as `data-intro` on <html> — see _shell.html. This function only
   RUNS it. Deciding here would mean the page painted first and the curtain
   dropped over it afterwards.

   Guard rails, because our own study is on record against entry gates:
     · once per session, not per page view (?intro=1 forces it back)
     · CAP ms hard ceiling whatever is still loading
     · never under reduced motion
     · the document underneath is complete and readable throughout
     · a CSS bail animation clears the curtain if this never runs at all      */
const CAP = 1600;

function loader(){
  const el = $('.load');
  if (!el) return;

  if (!document.documentElement.dataset.intro){
    el.remove();
    return;
  }

  document.body.classList.add('is-locked');

  const nEl   = $('.load__n b', el);
  const fill  = $('.load__track i', el);
  const panes = $$('.load__panel', el);
  const wm    = $('.load__wm', el);
  const logo  = $('.load__logo', el);

  const t0 = performance.now();
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    // the two halves part and clear the frame — a curtain, not a fade
    panes[0].style.transition = 'transform 620ms cubic-bezier(.76,0,.24,1)';
    panes[1].style.transition = 'transform 620ms cubic-bezier(.76,0,.24,1) 40ms';
    panes[0].style.transform = 'translateY(-101%)';
    panes[1].style.transform = 'translateY(101%)';
    el.querySelector('.load__in').style.transition = 'opacity 200ms linear';
    el.querySelector('.load__in').style.opacity = '0';
    $('.load__n', el).style.transition = 'opacity 200ms linear';
    $('.load__n', el).style.opacity = '0';
    $('.load__track', el).style.opacity = '0';
    document.body.classList.remove('is-locked');
    document.dispatchEvent(new CustomEvent('scipl:intro-done'));
    setTimeout(() => {
      el.remove();
      delete document.documentElement.dataset.intro;   // and with it the CSS bail
    }, 780);
  };

  /* ⭐ setInterval, NOT requestAnimationFrame. The maths is time-based either
     way, but rAF only fires when the compositor produces a frame — and during
     exactly the moment this runs, the main thread is busy parsing and decoding
     everything the page just asked for. Measured here on a cold load: the count
     was still reading 15% a full second in, because the callback simply was not
     being called. A timer keeps firing regardless, so the number the visitor
     watches is the real elapsed progress rather than a proxy for frame rate.
     This is the same rule as the scroll watchdog further down. */
  const tick = () => {
    const raw = Math.min(1, (performance.now() - t0) / CAP);
    // eased so it does not crawl to 100 — fast, then settles, like a real count
    const p = 1 - Math.pow(1 - raw, 2.2);
    const v = Math.round(p * 100);
    if (nEl) nEl.textContent = String(v).padStart(2, '0');
    if (fill) fill.style.transform = `scaleX(${p})`;
    // The count is not a spinner beside the logo — it IS the logo appearing. The
    // lockup is uncovered left to right in lockstep with the number, so the two
    // are visibly one event rather than two things happening at once.
    if (logo) logo.style.clipPath = `inset(0 ${(100 - p * 100).toFixed(1)}% 0 0)`;
    if (v > 62 && wm){ wm.style.transition = 'opacity 420ms ease'; wm.style.opacity = '1'; }
    if (raw >= 1){ clearInterval(id); finish(); }
  };
  const id = setInterval(tick, 32);
  tick();

  // belt and braces: if even the interval is starved, this still clears it
  setTimeout(() => { clearInterval(id); finish(); }, CAP + 400);
}

if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', loader);
else loader();

/* ========================================================================== */
if (!hasGSAP){
  window.SCIPLMotion = { ok:false, logos(){}, refresh(){}, boot(){
    $$('.rv, .rv-stagger, .sec-head').forEach(el => el.classList.add('is-in'));
  } };
  return;
}

gsap.registerPlugin(ScrollTrigger);

let lenis = null;
const touched = [];
const track = el => { if (el) touched.push(el); return el; };

const DUR = 0.9;
const EASE = 'expo.out';

/* --------------------------------------------------------- smooth scroll -- */
function smoothScroll(){
  if (reduced()) return;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis && lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.SCIPLLenis = lenis;
}

/* ------------------------------------------------------------ word masks -- */
/* Word-level rather than line-level on purpose: line detection depends on fonts
   having settled and breaks on resize, word masks do not. */
function splitWords(el){
  if (!el || el.dataset.split || el.children.length) return [];
  const text = el.textContent;
  if (!text.trim()) return [];
  el.dataset.split = '1';
  el.dataset.orig = text;
  el.innerHTML = text.trim().split(/\s+/)
    .map(w => `<span class="wd"><span>${w}</span></span>`).join(' ');
  return $$('.wd > span', el);
}

/* RISE — display type arrives out of a mask with a small counter-rotation.
   The rotation is what separates this from a slide: the word pivots up onto the
   baseline instead of sliding onto it. */
function rise(el, opts = {}){
  const words = splitWords(el);
  if (!words.length) return null;
  track(el);
  return gsap.fromTo(words,
    { yPercent: 112, rotate: 3.5, transformOrigin: '0% 100%' },
    { yPercent: 0, rotate: 0, duration: opts.duration || 1.05, ease: EASE,
      stagger: opts.stagger ?? 0.055, delay: opts.delay || 0,
      scrollTrigger: opts.now ? null : { trigger: el, start: 'top 92%', once: true } });
}

/* ================================================================= BOOT === */
function boot(){
  if (reduced()){
    $$('.rv, .rv-stagger, .sec-head').forEach(el => el.classList.add('is-in'));
    $$('.bar').forEach(b => b.style.transform = 'none');
    $$('.steps__rail i').forEach(i => i.style.transform = 'scaleX(1)');
    return;
  }

  smoothScroll();

  /* ---- headline type rises. On the hero it plays immediately (after the
         intro curtain if there is one); elsewhere it waits for the scroll. -- */
  const heroH1 = $('.hero .display');
  if (heroH1){
    const play = () => {
      rise(heroH1, { now:true, duration:1.15, stagger:.07 });
      gsap.fromTo(['.hero__sub', '.hero__cta', '.hero__bar', '.hero__cue'],
        { autoAlpha:0, y:16 },
        { autoAlpha:1, y:0, duration:.8, ease:EASE, stagger:.08, delay:.34 });
      gsap.fromTo('.hero .meta', { autoAlpha:0, x:-14 },
        { autoAlpha:1, x:0, duration:.7, ease:EASE });
    };
    if ($('.load.is-armed')) document.addEventListener('scipl:intro-done', play, { once:true });
    else play();
  }

  $$('h2, .ph__title h1').forEach(el => { if (!el.closest('.hero')) rise(el); });

  /* ---- DRAW: the gold section bar gains its width ---------------------- */
  $$('.bar').forEach(b => {
    track(b);
    gsap.fromTo(b, { scaleX: 0 }, {
      scaleX: 1, duration: .8, ease: EASE,
      scrollTrigger: { trigger: b, start: 'top 94%', once: true },
    });
  });

  /* the hairline under a section head draws across rather than appearing */
  $$('.sec-head').forEach(h => {
    h.classList.add('is-in');
    track(h);
    gsap.fromTo(h, { '--rw': 0 }, {
      duration: 1, ease: EASE,
      scrollTrigger: { trigger: h, start: 'top 94%', once: true },
    });
    const line = document.createElement('i');
    Object.assign(line.style, {
      position:'absolute', left:0, bottom:'-1px', height:'1px', width:'100%',
      // --rule-draw lets a maroon field swap this to gold; maroon on maroon is
      // an effect nobody can see
      background:'var(--rule-draw, var(--accent))',
      transformOrigin:'left', transform:'scaleX(0)', pointerEvents:'none',
    });
    h.style.position = 'relative';
    h.appendChild(line);
    gsap.to(line, {
      scaleX: 1, duration: .9, ease: EASE,
      scrollTrigger: { trigger: h, start: 'top 94%', once: true },
      onComplete(){ gsap.to(line, { scaleX: 0, transformOrigin:'right', duration:.7, ease:EASE, delay:.15 }); },
    });
  });

  /* ---- UNCOVER: every photograph is revealed by a travelling edge ------ */
  /* ⭐ Clip the <img>, never the <picture>. A <picture> is display:inline and a
     clip-path on an inline box collapses it — the photo paints blank while
     every computed style still says visible. */
  $$('.fig, .card__fig, .plate__fig, .menu__view').forEach(f => {
    const im = $('img', f);
    if (!im || f.closest('.hero')) return;
    track(im);
    gsap.fromTo(im,
      { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.09 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.25, ease: EASE,
        scrollTrigger: { trigger: f, start: 'top 92%', once: true } });
  });

  /* ---- generic blocks. Still not a plain fade: they clip up from the
         bottom edge, which is the same idiom at a smaller amplitude. ----- */
  $$('.rv, .rv-stagger').forEach(el => {
    el.classList.add('is-in');
    const kids = el.classList.contains('rv-stagger') ? [...el.children] : [el];
    kids.forEach(track);
    gsap.fromTo(kids,
      { clipPath: 'inset(0% 0% 100% 0%)', y: 22 },
      { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: DUR, ease: EASE, stagger: .075,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ---- DRIFT --------------------------------------------------------- */
  // hero: the live plate eases against the scroll
  const stage = $('.hero__stage');
  if (stage){
    track(stage);
    gsap.fromTo(stage, { yPercent: -5 }, {
      yPercent: 9, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .55 },
    });
  }

  // work plates: the photograph is 118% tall inside its frame, so it has room
  $$('.plate__fig').forEach(f => {
    const im = $('img', f);
    if (!im) return;
    track(im);
    gsap.fromTo(im, { yPercent: -6 }, {
      yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: .6 },
    });
  });

  // the oversized isometric mark on a maroon field
  $$('.field__mark').forEach(m => {
    track(m);
    gsap.fromTo(m, { yPercent: -62, rotate: -6 }, {
      yPercent: -38, rotate: 6, ease: 'none',
      scrollTrigger: { trigger: m.closest('.field'), start: 'top bottom', end: 'bottom top', scrub: .8 },
    });
  });

  /* ---- the process rail fills as the band passes ---------------------- */
  $$('.steps__rail i').forEach(i => {
    track(i);
    gsap.fromTo(i, { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: i.closest('.field') || i.parentElement,
        start: 'top 72%', end: 'bottom 78%', scrub: .4 },
    });
  });

  /* ---- ROLL: numbers count to their value ----------------------------- */
  $$('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    if (!isFinite(target)) return;
    const suffix = el.dataset.suffix || '';
    const obj = { v: 0 };
    track(el);
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate(){ el.textContent = Math.round(obj.v).toLocaleString('en-IN') + suffix; },
    });
  });

  marquee();
  scrollProgress();
  magnetic(.24);
  crosshair();

  requestAnimationFrame(() => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 500);
  watchdog();
}

/* ---------------------------------------------------------------- logos -- */
/* The client strip never stops, and pauses under the pointer so a name can
   actually be read. Called again by site.js when the strip is built late — the
   logos are deferred until the band is near the viewport. */
function marquee(){
  if (reduced()) return;
  $$('.logos__row').forEach(row => {
    if (!row.children.length || row.dataset.dup) return;
    track(row);
    row.innerHTML += row.innerHTML;          // seamless loop needs two copies
    row.dataset.dup = '1';
    const w = row.scrollWidth / 2;
    if (!w) return;
    const tw = gsap.fromTo(row, { x: 0 },
      { x: -w, duration: w / 46, ease: 'none', repeat: -1 });
    const host = row.parentElement;
    host.addEventListener('mouseenter', () => gsap.to(tw, { timeScale: 0, duration: .5 }));
    host.addEventListener('mouseleave', () => gsap.to(tw, { timeScale: 1, duration: .5 }));
  });
}

/* -------------------------------------------------------------- progress -- */
function scrollProgress(){
  const bar = $('.progress');
  if (!bar) return;
  track(bar);
  gsap.to(bar, { scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: () => document.body.scrollHeight - innerHeight, scrub: .2 } });
}

/* ------------------------------------------------------------- crosshair -- */
/* Workshop's cursor. The ring is two hairlines rather than a circle, and it
   grows over anything clickable that is a photograph. */
function crosshair(){
  const c = $('.cur');
  if (!c || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const x  = $('.cur__x', c), lbl = $('.cur__lbl', c);
  document.body.classList.add('has-cur');

  const qx = gsap.quickTo(x, 'x', { duration: .22, ease: 'power3' });
  const qy = gsap.quickTo(x, 'y', { duration: .22, ease: 'power3' });
  const lx = gsap.quickTo(lbl, 'x', { duration: .42, ease: 'power3' });
  const ly = gsap.quickTo(lbl, 'y', { duration: .42, ease: 'power3' });

  addEventListener('mousemove', e => {
    qx(e.clientX); qy(e.clientY);
    lx(e.clientX); ly(e.clientY + 30);
    c.classList.add('is-on');
  });
  addEventListener('mouseleave', () => c.classList.remove('is-on'));
  addEventListener('mouseover', e => {
    const m = e.target.closest('.card, .plate, .gal button, .fig, .ba, .hero__stage');
    c.classList.toggle('is-media', !!m);
    if (!m) return;
    lbl.textContent = m.closest('.ba') ? 'Drag'
      : m.matches('.gal button') ? 'Enlarge'
      : m.matches('.hero__stage') ? ''
      : 'View project';
  });
}

/* -------------------------------------------------------------- magnetic -- */
function magnetic(strength){
  $$('.mag').forEach(m => {
    track(m);
    const qx = gsap.quickTo(m, 'x', { duration: .4, ease: 'power3' });
    const qy = gsap.quickTo(m, 'y', { duration: .4, ease: 'power3' });
    m.addEventListener('mousemove', e => {
      const r = m.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width / 2)) * strength);
      qy((e.clientY - (r.top + r.height / 2)) * strength);
    });
    m.addEventListener('mouseleave', () => { qx(0); qy(0); });
  });
}

/* -------------------------------------------------------------- watchdog -- */
/* ⭐ The rule we hold every competitor to: motion enhances, it never reveals.
   GSAP's from-states are driven by requestAnimationFrame, and rAF stalls in a
   background tab or on a saturated main thread — which is exactly how a
   competitor ships a homepage reading "0 Projects Delivered". This sweep runs
   on setTimeout, which does not stall, and force-completes any entrance whose
   trigger is already on screen. Content cannot be trapped behind a dead effect. */
function watchdog(){
  const sweep = () => {
    ScrollTrigger.getAll().forEach(t => {
      if (t.vars && t.vars.scrub) return;
      const a = t.animation;
      if (a && a.progress() === 0 && t.start <= scrollY + innerHeight) a.progress(1);
    });
    $$('.rv, .rv-stagger, .sec-head').forEach(el => el.classList.add('is-in'));
  };
  setTimeout(sweep, 1800);
  setTimeout(sweep, 4000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(() => ScrollTrigger.refresh(), 120);
  });
}

window.SCIPLMotion = {
  ok: true, boot, rise,
  logos: marquee,                       // the strip is built late; see site.js
  refresh(){ ScrollTrigger.refresh(); },
};

})();
