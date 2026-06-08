/* =============================================================
   IRTH — theme.js  (Shopify asset, loaded at bottom of <body>)
   GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.20
   ============================================================= */

(function () {
  'use strict';

  /* ── GSAP registration ───────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);

  /* ── Progress bar ────────────────────────────────────────── */
  const prog = document.getElementById('prog');
  if (prog) {
    window.addEventListener('scroll', () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      prog.style.transform = `scaleX(${pct})`;
    }, { passive: true });
  }

  /* ── Veil page transition ────────────────────────────────── */
  const veil = document.getElementById('veil');
  if (veil) {
    // Reveal on first load
    gsap.set(veil, { y: '0%' });
    gsap.to(veil, { y: '-100%', duration: 0.7, ease: 'power3.inOut', delay: 0.1 });

    document.querySelectorAll('.nav-veil-link').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        e.preventDefault();
        gsap.to(veil, {
          y: '0%', duration: 0.7, ease: 'power3.inOut',
          onComplete: () => { window.location.href = href; }
        });
      });
    });
  }

  /* ── Custom cursor ───────────────────────────────────────── */
  const cursorDot  = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  if (cursorDot && cursorRing) {
    let cx = -100, cy = -100, rx = -100, ry = -100;

    window.addEventListener('mousemove', e => {
      cx = e.clientX; cy = e.clientY;
      gsap.set(cursorDot, { x: cx, y: cy });
    }, { passive: true });

    gsap.ticker.add(() => {
      rx += (cx - rx) * 0.12;
      ry += (cy - ry) * 0.12;
      gsap.set(cursorRing, { x: rx, y: ry });
    });

    document.querySelectorAll('a, button, [data-cursor-grow]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('grow');
        cursorRing.classList.add('grow');
      });
      el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('grow');
        cursorRing.classList.remove('grow');
      });
    });
  }

  /* ── Magnetic buttons ────────────────────────────────────── */
  function addMagnetic(selector, strength) {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - (r.left + r.width  / 2)) * strength,
          y: (e.clientY - (r.top  + r.height / 2)) * strength,
          duration: 0.35, ease: 'power2.out'
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }
  addMagnetic('.h-pill',    0.30);
  addMagnetic('.mag-btn',   0.25);
  addMagnetic('.n-cta-btn', 0.20);

  /* ── Lenis smooth scroll ─────────────────────────────────── */
  const lenis = new Lenis({ lerp: 0.075, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ── Marquee direction reversal on scroll-up ─────────────── */
  const marqueeTrack = document.querySelector('.marquee-track');
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    if (!marqueeTrack) return;
    const dir = window.scrollY < lastScrollY ? 'reverse' : 'normal';
    marqueeTrack.style.animationDirection = dir;
    lastScrollY = window.scrollY;
  }, { passive: true });

  /* ── Section title / eye-line reveals ───────────────────── */
  function initRevealLines() {
    gsap.utils.toArray('.sec-title, .sec-ey').forEach(el => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'overflow:hidden;display:block';
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
      gsap.fromTo(el,
        { yPercent: 105 },
        { yPercent: 0, duration: 1.0, ease: 'power3.out',
          scrollTrigger: { trigger: wrap, start: 'top 88%' }
        }
      );
    });

    gsap.utils.toArray('.fade-up').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' }
        }
      );
    });
  }

  /* ── Image parallax ──────────────────────────────────────── */
  function initImageParallax() {
    gsap.utils.toArray('.parallax-img').forEach(img => {
      gsap.fromTo(img,
        { yPercent: -7 },
        { yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: img.closest('.parallax-wrap') || img, scrub: true }
        }
      );
    });
  }

  /* ── Header scroll state ─────────────────────────────────── */
  function initHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Video hero (homepage only) ─────────────────────────── */
  function initVideoHero() {
    const heroVid  = document.getElementById('hero-vid');
    const hud      = document.getElementById('hud');
    const scrollSp = document.querySelector('.scroll-space');
    if (!heroVid || !scrollSp) return;

    let mouseX = 0, mouseY = 0, smoothX = 0, smoothY = 0, scrollScale = 1;

    window.addEventListener('mousemove', e => {
      mouseX = ((e.clientX - window.innerWidth  / 2) / (window.innerWidth  / 2)) * -26;
      mouseY = ((e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) * -18;
    }, { passive: true });

    gsap.ticker.add(() => {
      smoothX += (mouseX - smoothX) * 0.07;
      smoothY += (mouseY - smoothY) * 0.07;
      gsap.set(heroVid, {
        scale: scrollScale,
        x: smoothX / scrollScale,
        y: smoothY / scrollScale
      });
    });

    ScrollTrigger.create({
      trigger: scrollSp, start: 'top top', end: 'bottom top', scrub: 1.8,
      onUpdate(self) {
        scrollScale = 1 + self.progress * 0.40;
        if (hud) {
          const fade = self.progress > 0.72
            ? 1 - (self.progress - 0.72) / 0.28
            : 1;
          gsap.set(hud, { opacity: fade });
        }
      }
    });
  }

  /* ── Hero text entrance (homepage) ──────────────────────── */
  function animateHeroIn() {
    // Fade in the fixed video/bg layer
    gsap.to('#video-hero', { opacity: 1, duration: 1.2, ease: 'power2.out' });

    const tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo('.h-line-wrap:nth-child(1) .inner',
      { yPercent: 110 }, { yPercent: 0, duration: 1.05, ease: 'power3.out' })
      .fromTo('.h-line-wrap:nth-child(2) .inner',
        { yPercent: 110 }, { yPercent: 0, duration: 1.05, ease: 'power3.out' }, '-=.85')
      .fromTo('.h-pill',
        { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=.5')
      .fromTo('.h-bottom',
        { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=.5');
    return tl;
  }

  /* ── Nav entrance ────────────────────────────────────────── */
  function animateNavIn() {
    gsap.fromTo('#site-header',
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.2 }
    );
  }

  /* ── Entry screen (homepage) ─────────────────────────────── */
  function initEntry() {
    const entry = document.getElementById('entry-screen');
    if (!entry) return;

    // Blinking eyes
    const pupils = entry.querySelectorAll('.eye-pupil');
    pupils.forEach(p => {
      gsap.to(p, {
        scaleY: 0.05, duration: 0.12, ease: 'power2.in',
        repeat: -1, repeatDelay: 2.8, yoyo: true
      });
    });

    // Logo entrance
    gsap.fromTo('#entry-logo',
      { opacity: 0, scale: 0.92 },
      { opacity: 1, scale: 1, duration: 1.0, ease: 'power3.out', delay: 0.3 }
    );

    // Dismiss after 3.2 s
    gsap.to(entry, {
      opacity: 0, duration: 0.6, ease: 'power2.in', delay: 3.2,
      onComplete: () => {
        entry.style.display = 'none';
        animateNavIn();
        animateHeroIn();
      }
    });
  }

  /* ── Product cards hover line ────────────────────────────── */
  function initProductCards() {
    document.querySelectorAll('.prod-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card.querySelector('.prod-line'), { scaleX: 1, duration: 0.4, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card.querySelector('.prod-line'), { scaleX: 0, duration: 0.3, ease: 'power2.in' });
      });
    });
  }

  /* ── Init all ────────────────────────────────────────────── */
  function init() {
    initHeader();
    initRevealLines();
    initImageParallax();
    initProductCards();

    const isHome = document.body.classList.contains('template-index');
    if (isHome) {
      initEntry();
      initVideoHero();
    } else {
      animateNavIn();
      // Reveal content immediately on non-home pages
      gsap.fromTo('#main',
        { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.15 }
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
