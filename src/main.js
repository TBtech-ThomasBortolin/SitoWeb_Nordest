import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
if (import.meta.env.DEV) window.ScrollTrigger = ScrollTrigger;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.documentElement.classList.add('js-anim');
$('#year').textContent = new Date().getFullYear();

/* ---------- Smooth scroll ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToTarget = (target) => {
  if (lenis) lenis.scrollTo(target, { offset: -10 });
  else document.querySelector(target)?.scrollIntoView();
};
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !document.querySelector(id)) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(id);
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  });
});

/* ---------- Menu mobile ---------- */
const burger = $('.nav__burger');
const menu = $('#menu');
function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true;
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Apri menu');
  lenis?.start();
}
burger.addEventListener('click', () => {
  const open = menu.hidden;
  menu.hidden = !open;
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
  if (open) {
    lenis?.stop();
    gsap.from($$('#menu nav a'), { y: 30, opacity: 0, stagger: 0.05, duration: 0.5, ease: 'power3.out' });
  } else lenis?.start();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

/* ---------- Nav: nascondi scorrendo giù ---------- */
const nav = $('#nav');
let lastY = 0;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (self) => {
    const y = self.scroll();
    nav.classList.toggle('is-hidden', y > 300 && y > lastY && menu.hidden);
    lastY = y;
  },
});
// voce attiva (creata dopo il pin delle tecnologie, così le posizioni sono corrette)
function navActive() {
  $$('.nav__links a').forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: ({ isActive }) => a.classList.toggle('is-active', isActive),
    });
  });
}

/* ---------- Scena 3D (caricata in modo lazy) ---------- */
const loaderBar = $('.loader__bar span');
const loaderPct = $('.loader__pct');
const setLoad = (p) => {
  gsap.to(loaderBar, { width: `${Math.round(p * 100)}%`, duration: 0.4, ease: 'power2.out' });
  gsap.to({ v: Number(loaderPct.textContent) }, {
    v: Math.round(p * 100), duration: 0.4,
    onUpdate() { loaderPct.textContent = Math.round(this.targets()[0].v); },
  });
};
setLoad(0.25);

let world = null;
async function initWorld() {
  try {
    const { createScene } = await import('./scene.js');
    setLoad(0.7);
    world = createScene($('#scene'), { reducedMotion: reduced, onProgress: setLoad });
    // aspetta il modello 3D, ma non più di 8 secondi
    if (world) await Promise.race([world.ready, new Promise((r) => setTimeout(r, 8000))]);
    setLoad(1);
  } catch (err) {
    console.warn('WebGL non disponibile', err);
  }
  if (!world) document.body.classList.add('no-webgl');
  if (import.meta.env.DEV) window.__world = world;
  return world;
}

/* ---------- Intro ---------- */
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
  return $$('.w > span', el);
}

function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.loader', { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' })
    .from('.hero__title .split', { yPercent: 110, rotate: 4, duration: 1.4, stagger: 0.12 }, '-=0.2')
    .to('.hero .reveal-up', { opacity: 1, y: 0, duration: 1.1, stagger: 0.09 }, '-=1.0')
    .from('.nav', { opacity: 0, duration: 1, clearProps: 'opacity' }, '-=1.2')
    .from('.hero__scroll', { opacity: 0, duration: 1 }, '-=0.6');
  if (world && !reduced) {
    tl.fromTo(choreo, { intro: 0 }, { intro: 1, duration: 2.2, ease: 'expo.out' }, 0.2);
    tl.from(world.state, { spin: -Math.PI * 0.8, duration: 2.6, ease: 'expo.out' }, 0.2);
  }
}

/* ---------- Animazioni allo scroll ---------- */
function scrollAnimations() {
  // Titoli h2: parola per parola
  $$('.reveal-words').forEach((h) => {
    const words = splitWords(h);
    if (reduced) return;
    gsap.from(words, {
      yPercent: 105, duration: 1, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: h, start: 'top 85%' },
    });
  });

  // Paragrafi e blocchi (fuori dalla hero)
  $$('.reveal-up').filter((el) => !el.closest('.hero')).forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  if (reduced) return;

  // Card servizi: entrata a ventaglio 3D
  ScrollTrigger.batch('.card', {
    start: 'top 88%',
    onEnter: (batch) => gsap.fromTo(batch,
      { opacity: 0, y: 60, rotateX: -25, transformOrigin: '50% 100%' },
      { opacity: 1, y: 0, rotateX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, overwrite: true }),
  });
  gsap.set('.card', { opacity: 0 });

  // Foto "Chi siamo": parallasse
  $$('.about__media .photo').forEach((p) => {
    const d = Number(p.dataset.depth || 1);
    gsap.fromTo(p, { yPercent: 8 * d }, {
      yPercent: -8 * d, ease: 'none',
      scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  gsap.from('.photo--tall', {
    clipPath: 'inset(100% 0 0 0 round 18px)', duration: 1.6, ease: 'expo.out',
    scrollTrigger: { trigger: '.about__media', start: 'top 80%' },
  });
  gsap.from('.photo--small', {
    clipPath: 'inset(0 100% 0 0 round 18px)', duration: 1.6, ease: 'expo.out', delay: 0.2,
    scrollTrigger: { trigger: '.about__media', start: 'top 70%' },
  });

  // Processo: linea che si riempie e step che si accendono
  const steps = $('.steps');
  ScrollTrigger.create({
    trigger: steps, start: 'top 75%', end: 'bottom 55%', scrub: true,
    onUpdate: (self) => {
      steps.style.setProperty('--p', `${(self.progress * 100).toFixed(1)}%`);
      const n = $$('.step', steps);
      n.forEach((s, i) => s.classList.toggle('is-on', self.progress >= i / (n.length - 1) - 0.02));
    },
  });

  // Footer: scritta gigante
  gsap.from('.foot__big', {
    yPercent: 60, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
}

/* ---------- Tecnologie: scroll orizzontale bloccato ---------- */
function techScroll() {
  const track = $('.tech__track');
  const bar = $('.tech__progress span');
  if (reduced) {
    track.style.width = 'auto';
    track.style.overflowX = 'auto';
    $('.tech__pin').style.height = 'auto';
    return;
  }
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
  gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: '.tech', start: 'top top', end: () => `+=${dist()}`,
      pin: '.tech__pin', scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
    },
  });
}

/* ---------- Coreografia della scena 3D con lo scroll ---------- */
// Un unico stato calcolato a partire dal progresso delle sezioni:
// niente tween in conflitto sullo stesso oggetto.
const choreo = { intro: reduced ? 1 : 0, hero: 0, techIn: 0, tech: 0 };
const mix = (a, b, t) => a + (b - a) * t;

function worldScroll() {
  if (!world) return;
  const S = world.state;

  // Renderizza solo quando la canvas è effettivamente visibile (hero + tecnologie)
  const vis = { hero: true, tech: false };
  const apply = () => world.setVisible(vis.hero || vis.tech);
  ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: (s) => { vis.hero = s.isActive; apply(); } });
  ScrollTrigger.create({ trigger: '.tech', start: 'top bottom', end: 'bottom top', onToggle: (s) => { vis.tech = s.isActive; apply(); } });

  if (!reduced) {
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onUpdate: (s) => { choreo.hero = s.progress; } });
    ScrollTrigger.create({ trigger: '.tech', start: 'top bottom', end: 'top top', onUpdate: (s) => { choreo.techIn = s.progress; } });
    ScrollTrigger.create({ trigger: '.tech', start: 'top top', end: 'bottom bottom', onUpdate: (s) => { choreo.tech = s.progress; } });
  }

  gsap.ticker.add(() => {
    const small = window.innerWidth < 760;
    const L = world.layout();
    const k = choreo.intro;
    let x, y, scale, rotY, laser, rings;
    if (choreo.techIn > 0) {
      const t = choreo.techIn;
      // in alto a destra, accanto al titolo della sezione
      // desktop: in alto a destra accanto al titolo; mobile: dietro ai pannelli in vetro
      x = small ? 0 : L.x * 1.25;
      y = mix(4.5, small ? -1.1 : 1.95, t);
      scale = mix(0.3, small ? 0.34 : 0.5, t);
      laser = t;
      rings = mix(1, 0.25, t);
      rotY = mix(1.2, 2.4, t) + choreo.tech * 2.6;
    } else {
      const h = choreo.hero;
      x = mix(L.x, small ? 0 : 1.2, h);
      y = mix(L.y, -2.2, h);
      scale = mix(L.scale, small ? 0.7 : 1.2, h);
      rotY = 1.2 * h;
      laser = 0;
      rings = 1;
    }
    S.x = x;
    S.y = y - (1 - k) * 2;
    S.scale = scale * mix(0.2, 1, k);
    S.rotY = rotY;
    S.laser = laser;
    S.ringsOpacity = rings;
  });
}

/* ---------- Selettore vernice ---------- */
function paintPicker() {
  const name = $('.paint__name');
  $$('.swatch').forEach((b) => {
    b.addEventListener('click', () => {
      $$('.swatch').forEach((x) => { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('is-active');
      b.setAttribute('aria-pressed', 'true');
      name.textContent = b.getAttribute('aria-label');
      document.documentElement.style.setProperty('--paint', b.dataset.color);
      world?.setPaint(b.dataset.color, gsap);
    });
  });
}

/* ---------- Micro-interazioni ---------- */
function interactions() {
  if (!finePointer || reduced) return;

  // Bottoni magnetici
  $$('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });

  // Tilt 3D + luce che segue il cursore
  $$('.tilt').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 12);
      rx((0.5 - py) * 12);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ---------- Mappa (consenso al click) ---------- */
$('#loadMap').addEventListener('click', () => {
  const map = $('.map');
  map.innerHTML = '<iframe title="Mappa: Carrozzeria Nord Est, Via Strada Oselin 39/15, Remanzacco" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Carrozzeria+Nord+Est+di+Greatti+Ivan,+Via+Strada+Oselin+39/15,+33047+Remanzacco+UD&ll=46.0764238,13.3026326&z=16&hl=it&output=embed"></iframe>';
});

/* ---------- Form preventivo → e-mail precompilata ---------- */
const form = $('#quote');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(form);
  let ok = true;
  [['name', 'q-name'], ['phone', 'q-phone']].forEach(([k, id]) => {
    const input = $('#' + id);
    const err = $(`#${id}-err`);
    const bad = !String(f.get(k) || '').trim();
    input.setAttribute('aria-invalid', String(bad));
    input.setAttribute('aria-describedby', bad ? `${id}-err` : '');
    err.hidden = !bad;
    if (bad && ok) { input.focus(); ok = false; }
  });
  if (!ok) return;
  const body = [
    `Nome: ${f.get('name')}`,
    `Telefono: ${f.get('phone')}`,
    `Auto: ${f.get('car') || '-'}`,
    `Intervento: ${f.get('type')}`,
    '',
    String(f.get('msg') || ''),
  ].join('\n');
  const subject = `Richiesta preventivo - ${f.get('type')}`;
  window.location.href = `mailto:carrozzerianordest.udine@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

/* ---------- Avvio ---------- */
(async () => {
  await Promise.all([initWorld(), document.fonts?.ready]);
  paintPicker();
  techScroll();
  navActive();
  scrollAnimations();
  worldScroll();
  interactions();
  intro();
  ScrollTrigger.refresh();
})();
