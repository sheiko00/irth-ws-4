(function () {
  'use strict';
  gsap.registerPlugin(ScrollTrigger);

  /* ══════════════════════════════════════════
     PRELOADER
  ══════════════════════════════════════════ */
  const preloader = document.getElementById('preloader');
  const preBar    = document.getElementById('pre-bar');
  const prePct    = document.getElementById('pre-pct');
  const preLogo   = document.getElementById('pre-logo');
  let loadPct = 0;

  gsap.to(preLogo, { opacity: 1, y: 0, duration: .6, ease: 'power2.out', delay: .1 });

  const loadInterval = setInterval(() => {
    loadPct += Math.random() * 18 + 5;
    if (loadPct >= 100) {
      loadPct = 100;
      clearInterval(loadInterval);
      preBar.style.width = '100%';
      prePct.textContent = '100%';
      setTimeout(showEntry, 520);
    } else {
      preBar.style.width = loadPct.toFixed(0) + '%';
      prePct.textContent = loadPct.toFixed(0) + '%';
    }
  }, 80);

  function showEntry() {
    gsap.to(preloader, {
      opacity: 0, duration: .6, ease: 'power2.in',
      onComplete: () => {
        preloader.style.display = 'none';
        if (window.innerWidth <= 768) { warmAmbient(); doEnterDirect(); }
      }
    });
  }

  /* ══════════════════════════════════════════
     CURSOR
  ══════════════════════════════════════════ */
  const cur      = document.getElementById('cur');
  const curRing  = document.getElementById('cur-ring');
  const curLabel = document.getElementById('cur-label');
  let mx = 0, my = 0, rx = 0, ry = 0;

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCED_MOTION) document.documentElement.classList.add('reduced-motion');

  let qxCur, qyCur;
  if (!REDUCED_MOTION) {
    qxCur = gsap.quickTo(cur, 'x', { duration: 0.07 });
    qyCur = gsap.quickTo(cur, 'y', { duration: 0.07 });
    (function rf() {
      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
      gsap.set(curRing, { x: rx, y: ry });
      requestAnimationFrame(rf);
    })();
  } else {
    document.body.style.cursor = 'auto';
    [cur, curRing, curLabel].forEach(el => { if (el) el.style.display = 'none'; });
  }

  function setCursorLabel(txt) {
    curLabel.textContent = txt;
    curLabel.classList.toggle('vis', !!txt);
  }

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => {
      gsap.to(cur, { scale: 0.4, duration: .3 });
      gsap.to(curRing, { scale: 1.7, duration: .4 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(cur, { scale: 1, duration: .3 });
      gsap.to(curRing, { scale: 1, duration: .4 });
      setCursorLabel('');
    });
  });

  document.querySelectorAll('.prod-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(cur, { scale: 0.3, duration: .3 });
      gsap.to(curRing, { scale: 2.0, duration: .4 });
      setCursorLabel('VIEW →');
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(cur, { scale: 1, duration: .3 });
      gsap.to(curRing, { scale: 1, duration: .4 });
      setCursorLabel('');
    });
  });

  document.querySelectorAll('.hs-panel').forEach(p => {
    p.addEventListener('mouseenter', () => setCursorLabel('DRAG →'));
    p.addEventListener('mouseleave', () => setCursorLabel(''));
  });

  /* ══════════════════════════════════════════
     EYES
  ══════════════════════════════════════════ */
  const pl = document.getElementById('pl');
  const pr = document.getElementById('pr');

  /* ══════════════════════════════════════════
     PAGE TRANSITION VEIL
  ══════════════════════════════════════════ */
  const veil = document.getElementById('veil');
  document.querySelectorAll('.nav-veil-link').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      e.preventDefault();
      gsap.to(veil, {
        y: '0%', duration: .7, ease: 'power3.inOut',
        onComplete: () => { window.location.href = href; }
      });
    });
  });
  gsap.set(veil, { y: '0%' });
  gsap.to(veil, { y: '-100%', duration: .7, ease: 'power3.inOut', delay: .1 });

  /* ══════════════════════════════════════════
     VIDEO PARALLAX
  ══════════════════════════════════════════ */
  const heroVid   = document.getElementById('hero-vid');
  const videoHero = document.getElementById('video-hero');
  const hud       = document.getElementById('hud');
  let mouseX = 0, mouseY = 0, smoothX = 0, smoothY = 0, scrollScale = 1;

  /* Unified mousemove — cursor (if !RM) + eyes + video parallax */
  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (qxCur) { qxCur(mx); qyCur(my); gsap.set(curLabel, { x: mx, y: my }); }
    [pl, pr].forEach(p => {
      if (!p) return;
      const eye = p.parentElement;
      const r = eye.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      p.style.transform = `translate(${Math.max(-10,Math.min(10,(e.clientX-cx)*.18))}px,${Math.max(-8,Math.min(8,(e.clientY-cy)*.14))}px)`;
    });
    mouseX = ((e.clientX - window.innerWidth  / 2) / (window.innerWidth  / 2)) * -26;
    mouseY = ((e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) * -18;
  }, { passive: true });
  gsap.ticker.add(() => {
    smoothX += (mouseX - smoothX) * 0.07;
    smoothY += (mouseY - smoothY) * 0.07;
    gsap.set(heroVid, { scale: scrollScale, x: smoothX / scrollScale, y: smoothY / scrollScale });
  });

  /* ══════════════════════════════════════════
     MAGNETIC BUTTONS
  ══════════════════════════════════════════ */
  function addMagnetic(selector, strength) {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - (r.left + r.width/2)) * strength,
          y: (e.clientY - (r.top + r.height/2)) * strength,
          duration: .35, ease: 'power2.out'
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: .65, ease: 'elastic.out(1,.5)' });
      });
    });
  }

  /* ══════════════════════════════════════════
     PRODUCT OVERLAY
  ══════════════════════════════════════════ */
  const overlay = document.getElementById('prod-overlay');
  const ovClose = document.getElementById('ov-close');
  let overlayOpen = false;

  document.querySelectorAll('.prod-card').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
    card.addEventListener('click', () => {
      // Use the card's actual rendered img src (Shopify CDN URL) — avoids broken relative path
      document.getElementById('ov-img').src            = card.querySelector('.prod-img img')?.src || '';
      document.getElementById('ov-num').textContent     = card.dataset.prodNum;
      document.getElementById('ov-name-ar').textContent = card.dataset.prodAr;
      document.getElementById('ov-name-en').textContent = card.dataset.prodEn;
      document.getElementById('ov-desc').textContent    = card.dataset.prodDesc;
      document.getElementById('ov-desc-ar').textContent = card.dataset.prodDescAr;
      document.getElementById('ov-origin').textContent  = card.dataset.prodOrigin;

      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('open');
      overlayOpen = true;
      setTimeout(() => { if (ovClose) ovClose.focus(); }, 50);

      gsap.fromTo(overlay,
        { y: '100%' },
        { y: '0%', duration: .8, ease: 'power3.inOut' }
      );
      gsap.fromTo('.ov-info-side > *',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: .07, duration: .65, ease: 'power2.out', delay: .45 }
      );
    });
  });

  function closeOverlay() {
    if (!overlayOpen) return;
    gsap.to(overlay, {
      y: '100%', duration: .7, ease: 'power3.inOut',
      onComplete: () => {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        overlayOpen = false;
      }
    });
  }

  ovClose.addEventListener('click', closeOverlay);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });

  /* ══════════════════════════════════════════
     ENTRY
  ══════════════════════════════════════════ */
  const entry = document.getElementById('entry');
  let entered = false;

  function animateHeroIn() {
    const tl = gsap.timeline({ delay: 0.55 });
    tl.fromTo('.fnav-bar', { y: -22, opacity: 0 }, { y: 0, opacity: 1, pointerEvents: 'all', duration: .8, ease: 'power2.out' })
      .fromTo('.h-eyebrow', { opacity: 0, y: 10 }, { opacity: 0.6, y: 0, duration: .6 }, '-=.4')
      .fromTo('.hero-logo-seal', { opacity: 0, scale: .8 }, { opacity: 1, scale: 1, duration: .3, ease: 'power2.out' }, '-=.35')
      .fromTo('.h-line-wrap:nth-child(1) .inner',
        { yPercent: 110 }, { yPercent: 0, duration: 1.05, ease: 'power3.out' }, '-=.35')
      .fromTo('.h-line-wrap:nth-child(2) .inner',
        { yPercent: 110 }, { yPercent: 0, duration: 1.05, ease: 'power3.out' }, '-=.85')
      .fromTo('.h-pill',   { opacity: 0, y: 16, scale: .95 }, { opacity: 1, y: 0, scale: 1, duration: .6, onComplete: () => { document.querySelector('.h-pill').classList.add('floating'); const ap=document.querySelector('.audio-pill'); if(ap) ap.classList.add('floating'); } }, '-=.5')
      .fromTo('.h-bottom', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .6 }, '-=.45');
  }

  /* ── TRANSITION VIDEO ENTER — fullscreen cinematic ── */
  const transOverlay = document.getElementById('trans-overlay');
  const transVid     = document.getElementById('trans-vid');
  const transFlash   = document.getElementById('trans-flash');
  const filmTitle    = document.getElementById('film-title');
  const filmLbTop    = document.querySelector('.film-lb-top');
  const filmLbBot    = document.querySelector('.film-lb-bot');
  let finishCalled   = false;

  // Pre-set iris closed
  gsap.set(transOverlay, { clipPath: 'circle(0% at 50% 44%)', opacity: 1 });

  function _activateHero() {
    videoHero.style.opacity = '1';
    document.getElementById('chroma').classList.add('on');
    heroVid.muted = true;
    heroVid.play().catch(() => {});
    gsap.set(hud, { opacity: 1 });
    animateHeroIn();
    initScroll();
    initHeroParallax();
    initAudioReactive();
    initMagnetic();
    initTilt();
    initCursorSwap();
    initParticles();
    initSceneCards();
  }

  function finishEnter() {
    if (finishCalled) return;
    finishCalled = true;
    transVid.pause();
    _activateHero();
    // Letterbox bars recede
    gsap.to(filmLbTop, { yPercent: -100, duration: 1.4, ease: 'power3.inOut' });
    gsap.to(filmLbBot, { yPercent: 100, duration: 1.4, ease: 'power3.inOut' });
    gsap.to(filmTitle, { opacity: 0, duration: .4, ease: 'power2.in' });
    // Cinematic dissolve: video blurs + darkens → hero emerges underneath
    setTimeout(() => {
      // Step 1 — intro video blurs out while hero is already fading in behind it
      gsap.to(transVid, {
        opacity: 0,
        filter: 'blur(14px) brightness(0.3)',
        scale: 1.06,
        duration: 1.0,
        ease: 'power2.in'
      });
      // Step 2 — dark overlay flashes up then the whole overlay collapses
      gsap.to(transFlash, { opacity: 1, duration: .55, ease: 'power2.inOut', delay: .55,
        onComplete: () => {
          document.getElementById('letterbox-top').classList.add('recede');
          document.getElementById('letterbox-bot').classList.add('recede');
          gsap.to(transOverlay, {
            opacity: 0,
            duration: .9,
            ease: 'power2.inOut',
            delay: .08,
            onComplete: () => { transOverlay.style.display = 'none'; }
          });
        }
      });
    }, 150);
  }

  function doEnter() {
    if (entered) return;
    entered = true;
    // Entry screen fade + lift
    gsap.to(entry, {
      opacity: 0, scale: 1.05, duration: .6, ease: 'power2.inOut',
      onComplete: () => { entry.style.display = 'none'; }
    });
    // Iris expand
    transOverlay.style.pointerEvents = 'all';
    gsap.to(transOverlay, {
      clipPath: 'circle(150% at 50% 44%)',
      duration: .9, ease: 'power2.inOut',
      onComplete: () => {
        // Video fade in
        gsap.to(transVid, { opacity: 1, duration: .55, ease: 'power2.out' });
        transVid.classList.add('playing');
        transVid.play().catch(() => { finishEnter(); });
        // Letterbox bars slide IN — cinematic crop
        gsap.to(filmLbTop, { yPercent: 0, duration: .75, ease: 'power3.out', delay: .1 });
        gsap.to(filmLbBot, { yPercent: 0, duration: .75, ease: 'power3.out', delay: .1 });
        // Title emerge at 2.2s
        gsap.fromTo(filmTitle,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 2.2 }
        );
        // Title hold then fade at 7s
        gsap.to(filmTitle, { opacity: 0, y: -18, duration: .9, ease: 'power2.in', delay: 7.0 });
      }
    });
    transVid.addEventListener('ended', finishEnter, { once: true });
    // Safety gate — fires at 10.5s if 'ended' event doesn't fire (e.g. mobile autoplay blocked)
    setTimeout(finishEnter, 10500);
  }

  function doEnterDirect() {
    if (entered) return;
    entered = true;
    gsap.to(entry, { opacity: 0, duration: .85, ease: 'power2.inOut',
      onComplete: () => { entry.style.display = 'none'; }
    });
    _activateHero();
    setTimeout(() => {
      document.getElementById('letterbox-top').classList.add('recede');
      document.getElementById('letterbox-bot').classList.add('recede');
    }, 850);
  }

  // ── Stage 1 audio (Phase 05): warm-load ambient buffer on entry. Audio is
  //    preload="none" for perf; the entry click is a user gesture, so load() now
  //    means the pill toggle plays instantly later. Entry itself stays SILENT. ──
  let _ambientWarmed = false;
  function warmAmbient() {
    if (_ambientWarmed) return;
    _ambientWarmed = true;
    const amb = document.getElementById('amb-track');
    if (amb) { try { amb.load(); } catch (e) {} }
  }
  document.getElementById('e-enter').addEventListener('click', () => {
    warmAmbient();
    if (window.innerWidth <= 768) doEnterDirect(); else doEnter();
  });
  document.getElementById('e-skip').addEventListener('click', e => { e.preventDefault(); warmAmbient(); doEnterDirect(); });

  /* ══════════════════════════════════════════
     SECTION INDICATOR
  ══════════════════════════════════════════ */
  const siEl   = document.getElementById('sec-indicator');
  const siNum  = document.getElementById('si-num');
  const siName = document.getElementById('si-name');

  function updateSection(num, name) {
    gsap.to(siEl, { opacity: 0, y: 6, duration: .2, onComplete: () => {
      siNum.textContent  = num;
      siName.textContent = name;
      gsap.to(siEl, { opacity: 1, y: 0, duration: .3 });
    }});
  }

  /* ══════════════════════════════════════════
     STATS COUNT-UP
  ══════════════════════════════════════════ */
  function initCountUp() {
    document.querySelectorAll('.stat-num[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: () => {
          gsap.to({ val: 0 }, {
            val: target, duration: 1.4, ease: 'power2.out',
            onUpdate: function () {
              el.textContent = Math.round(this.targets()[0].val);
            },
            onComplete: () => { el.textContent = target; }
          });
        }
      });
    });
  }

  /* ══════════════════════════════════════════
     HORIZONTAL SCROLL
  ══════════════════════════════════════════ */
  function initHScroll() {
    const section = document.getElementById('hscroll-section');
    const track   = document.getElementById('hscroll-track');

    if (window.innerWidth <= 768) return;

    // Reduced-motion: no scroll-jacking pin — make showcase a simple swipeable strip
    if (REDUCED_MOTION) {
      section.style.height = 'auto';
      const sticky = document.getElementById('hscroll-sticky');
      if (sticky) { sticky.style.position = 'static'; sticky.style.overflowX = 'auto'; }
      track.style.willChange = 'auto';
      return;
    }

    track.style.willChange = 'transform';
    track.style.backfaceVisibility = 'hidden';

    const totalWidth = track.scrollWidth;
    const extraScroll = totalWidth - window.innerWidth;

    // Set section height to drive scroll distance
    section.style.height = (extraScroll + window.innerHeight) + 'px';

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${extraScroll}`,
      pin: '#hscroll-sticky',
      scrub: 1.2,
      onUpdate: self => {
        gsap.set(track, { x: -self.progress * extraScroll });
      }
    });
  }

  /* ══════════════════════════════════════════
     SCROLL INIT
  ══════════════════════════════════════════ */
  function initScroll() {
    const lenis = new Lenis({ lerp: 0.075 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tm => lenis.raf(tm * 1000));
    gsap.ticker.lagSmoothing(0);

    // Progress bar
    const prog = document.getElementById('prog');
    prog.classList.add('vis');
    ScrollTrigger.create({
      start: 'top top', end: 'bottom bottom',
      onUpdate: self => { prog.style.width = (self.progress * 100) + '%'; }
    });

    // Seal logo — beige dust dissolve as hero scrolls away
    gsap.to('.hero-logo-seal', {
      opacity: 0, scale: 2.4, filter: 'blur(20px)',
      scrollTrigger: { trigger: '.scroll-space', start: 'top top', end: '22% top', scrub: 1.2 }
    });

    // Video zoom
    ScrollTrigger.create({
      trigger: '.scroll-space', start: 'top top', end: 'bottom top', scrub: 1.8,
      onUpdate(self) {
        const p = self.progress;
        scrollScale = 1 + p * 0.40;
        const fade = p > 0.72 ? 1 - (p - 0.72) / 0.28 : 1;
        gsap.set(hud, { opacity: fade });
        gsap.set('.video-fade-bottom', { opacity: p > 0.82 ? 1 - (p - 0.82) / 0.18 : 1 });
      }
    });

    /* PHASE 2 · Color-shift bg across scroll (sand → madinah → sand) */
    const root = document.documentElement;
    ScrollTrigger.create({
      start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate(self) {
        const p = self.progress;
        // Three-stop palette interpolation
        let r, g, b;
        if (p < 0.5) {
          const t = p / 0.5;
          // sand (#E9E2D5) → madinah (#0E2B22)
          r = Math.round(233 + (14  - 233) * t);
          g = Math.round(226 + (43  - 226) * t);
          b = Math.round(213 + (34  - 213) * t);
        } else {
          const t = (p - 0.5) / 0.5;
          // madinah → linen (#F0E8DC)
          r = Math.round(14  + (240 - 14)  * t);
          g = Math.round(43  + (232 - 43)  * t);
          b = Math.round(34  + (220 - 34)  * t);
        }
        root.style.setProperty('--scroll-bg', `rgb(${r},${g},${b})`);
        document.body.style.background = `var(--scroll-bg)`;
      }
    });

    /* PHASE 2 · Marquee velocity-react */
    const marqueeEl = document.getElementById('marquee-inner');
    if (marqueeEl) {
      let lastY = 0, vel = 0;
      const baseDuration = 28;
      lenis.on('scroll', ({ scroll }) => {
        vel = Math.abs(scroll - lastY);
        lastY = scroll;
        const factor = Math.max(0.35, 1 - Math.min(vel / 40, 0.8));
        marqueeEl.style.animationDuration = (baseDuration * factor) + 's';
      });
    }

    /* PHASE 2 · Pin story image side */
    const storyImgPin = document.querySelector('.story-img-side');
    if (storyImgPin && window.innerWidth > 768) {
      ScrollTrigger.create({
        trigger: '#story', start: 'top top', end: 'bottom bottom',
        pin: storyImgPin, pinSpacing: false
      });
    }

    // Section indicator watcher
    siEl.classList.add('vis');
    document.querySelectorAll('[data-section]').forEach(sec => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 60%',
        onEnter: () => updateSection(sec.dataset.section, sec.dataset.sectionName),
        onEnterBack: () => updateSection(sec.dataset.section, sec.dataset.sectionName),
      });
    });

    // Section title / eyebrow reveals
    gsap.utils.toArray('.sec-title, .sec-ey, .story-ey, .hs-intro-ey').forEach(el => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'overflow:hidden;display:block';
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
      gsap.fromTo(el, { yPercent: 105 }, {
        yPercent: 0, duration: 1.0, ease: 'power3.out',
        scrollTrigger: { trigger: wrap, start: 'top 88%' }
      });
    });

    // Story title
    gsap.utils.toArray('.story-title, .hs-intro-title').forEach(el => {
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1.0, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    // Value name Arabic clip reveals
    gsap.utils.toArray('.val-name-ar').forEach((el, i) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'overflow:hidden;display:block';
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
      gsap.fromTo(el, { yPercent: 100 }, {
        yPercent: 0, duration: 1.1, ease: 'power3.out', delay: i * 0.1,
        scrollTrigger: { trigger: wrap, start: 'top 85%' }
      });
    });

    // Product cards
    gsap.utils.toArray('.prod-card').forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 52 }, {
        opacity: 1, y: 0, duration: .85, ease: 'power2.out', delay: i * 0.07,
        scrollTrigger: { trigger: card, start: 'top 88%' }
      });
      const img = card.querySelector('.prod-img img');
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Story image parallax
    const storyImg = document.querySelector('.story-img-side img');
    if (storyImg) {
      gsap.fromTo(storyImg, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: '#story', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    // Story text side
    gsap.utils.toArray('.story-body, .story-body-ar, .story-stats').forEach((el, i) => {
      gsap.fromTo(el, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: .85, ease: 'power2.out', delay: i * .12,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // Count-up stats
    initCountUp();

    // Values stagger
    gsap.utils.toArray('.val').forEach((el, i) => {
      gsap.fromTo(el, { opacity: 0, y: 36 }, {
        opacity: 1, y: 0, duration: .85, ease: 'power2.out', delay: i * 0.12,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // Contact
    gsap.utils.toArray('#contact .contact-title, #contact .contact-email, #contact .contact-btn').forEach((el, i) => {
      gsap.fromTo(el, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: .85, ease: 'power2.out', delay: i * 0.15,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // Section-level reveals
    gsap.utils.toArray('#products, #values, #contact, footer, #story').forEach(el => {
      gsap.fromTo(el, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: .8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%' }
      });
    });

    // Marquee direction
    const marquee = document.getElementById('marquee-inner');
    let marqueeDir = 1, lastSY = 0;
    window.addEventListener('scroll', () => {
      const dir = window.scrollY > lastSY ? 1 : -1;
      lastSY = window.scrollY;
      if (dir !== marqueeDir) {
        marqueeDir = dir;
        marquee.style.animationDirection = dir === 1 ? 'normal' : 'reverse';
      }
    }, { passive: true });

    /* ── RITUAL FRAME SEQUENCER (Phase 06) ── */
    (function initRitual() {
      const FRAME_COUNT = 240;
      const FRAME_PATH  = ''+window.IRTH_FRAME_BASE+'irth_';

      const ritualScene = document.getElementById('ritual');
      const ritualHero  = document.querySelector('.ritual-hero');
      const mainCanvas  = document.getElementById('ritualFrames');
      const bgCanvas    = document.getElementById('ritualFramesBg');
      if (!ritualScene || !mainCanvas) return;
      // Skip canvas animation on mobile — 240 JPEGs exhaust mobile heap; fallback img shown instead
      if (window.innerWidth < 768) {
        const fb = ritualScene.querySelector('.ritual-fallback');
        if (fb) fb.style.display = 'block';
        return;
      }

      const ctx   = mainCanvas.getContext('2d');
      const bgCtx = bgCanvas.getContext('2d');

      const frames = new Array(FRAME_COUNT);
      let curFrame = -1, canvasW = 0, canvasH = 0, ticking = false;

      const stageEls   = [...document.querySelectorAll('[data-ritual-stage]')];
      const stageNum   = document.querySelector('.ritual-stage-index');
      const frameUrl   = i => `${FRAME_PATH}${String(i+1).padStart(4,'0')}.jpg`;

      function loadFrame(i) {
        if (frames[i]) return frames[i];
        const img = new Image();
        img.decoding = 'async';
        img.src = frameUrl(i);
        frames[i] = img;
        return img;
      }

      function resizeCanvas() {
        const r   = mainCanvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(r.width * dpr));
        const h = Math.max(1, Math.round(r.height * dpr));
        if (w === canvasW && h === canvasH) return;
        canvasW = w; canvasH = h;
        mainCanvas.width = w; mainCanvas.height = h;
        bgCanvas.width   = w; bgCanvas.height   = h;
        curFrame = -1;
      }

      function paintCover(tCtx, img) {
        const s  = Math.max(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
        const sw = canvasW / s, sh = canvasH / s;
        const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2;
        tCtx.clearRect(0, 0, canvasW, canvasH);
        tCtx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
      }

      function paintContain(tCtx, img) {
        const s  = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight) * 0.98;
        const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        tCtx.clearRect(0, 0, canvasW, canvasH);
        tCtx.drawImage(img, (canvasW - dw) / 2, (canvasH - dh) / 2, dw, dh);
      }

      function drawFrame(i) {
        resizeCanvas();
        if (i === curFrame) return;
        const img = loadFrame(i);
        const paint = () => {
          paintCover(bgCtx, img);
          paintCover(ctx, img);
          curFrame = i;
          document.querySelector('.ritual-media').classList.add('is-ready');
        };
        if (img.complete && img.naturalWidth > 0) paint();
        else img.addEventListener('load', paint, { once: true });
      }

      function warmFrames(i) {
        const behind = 4, ahead = 18;
        for (let f = Math.max(0, i - behind); f <= Math.min(FRAME_COUNT-1, i + ahead); f++) loadFrame(f);
      }

      function getProgress() {
        const rect = ritualScene.getBoundingClientRect();
        const scrollable = Math.max(1, rect.height - window.innerHeight);
        return Math.min(1, Math.max(0, -rect.top / scrollable));
      }

      function updateStages(p) {
        const s = Math.min(3, Math.floor(p * 4));
        stageEls.forEach((el, i) => el.classList.toggle('is-active', i === s));
        if (stageNum) stageNum.textContent = String(s+1).padStart(2,'0');
      }

      function applyProgress() {
        const p  = getProgress();
        const fi = Math.round(p * (FRAME_COUNT - 1));
        ritualHero.style.setProperty('--ritual-progress', p.toFixed(4));
        drawFrame(fi);
        warmFrames(fi);
        updateStages(p);
      }

      function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { applyProgress(); ticking = false; });
      }

      // Preload first 30 frames immediately for smooth scroll start
      for (let i = 0; i < 30; i++) loadFrame(i);

      lenis.on('scroll', requestUpdate);
      window.addEventListener('resize', () => { curFrame = -1; requestUpdate(); }, { passive: true });
      requestUpdate();
    })();

    // Horizontal scroll
    initHScroll();

    /* ── GIFTS SECTION — tab + card interactivity ── */
    const _giftPlaceholders = {
      ramadan:   'مثال: بمناسبة رمضان الكريم، أهدي إليك أجود تمور المدينة.',
      eid:       'مثال: كل عام وأنتم بخير — هدية من القلب بمناسبة العيد المبارك.',
      wedding:   'مثال: ألف مبروك — هدية في يومكم الجميل من مجموعة إرث.',
      corporate: 'مثال: بمناسبة الشراكة العزيزة — هدية مختارة بعناية من إرث.'
    };
    const _giftTA = document.getElementById('giftMessage');
    document.querySelectorAll('.gift-tab').forEach(tab => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
      tab.addEventListener('click', () => {
        document.querySelectorAll('.gift-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        if (_giftTA && _giftPlaceholders[tab.dataset.occasion])
          _giftTA.setAttribute('placeholder', _giftPlaceholders[tab.dataset.occasion]);
      });
    });
    document.querySelectorAll('.gift-card').forEach(card => {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', card.classList.contains('selected') ? 'true' : 'false');
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
      card.addEventListener('click', () => {
        document.querySelectorAll('.gift-card').forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
      });
    });
  }

  /* ══════════════════════════════════════════
     MOBILE NAV
  ══════════════════════════════════════════ */
  const fnavBar     = document.getElementById('fnavBar');
  const navSentinel = document.getElementById('navSentinel');
  const burger      = document.getElementById('fnavBurger');
  const mobileNav   = document.getElementById('mobile-nav');
  const mobileNavClose = document.getElementById('mobile-nav-close');

  /* Floating nav — compact once scrolled past the 80px sentinel */
  if (fnavBar && navSentinel) {
    const navObserver = new IntersectionObserver(
      ([e]) => fnavBar.classList.toggle('compact', !e.isIntersecting),
      { threshold: 0 });
    navObserver.observe(navSentinel);
  }
  /* Cart badge pulse — call window.pulseCartBadge(n) when cart count changes */
  function pulseCartBadge(newCount) {
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    badge.textContent = newCount;
    badge.classList.remove('pulse');
    requestAnimationFrame(() => badge.classList.add('pulse'));
  }
  window.pulseCartBadge = pulseCartBadge;

  /* ── PHASE 4 · GOLD DUST PARTICLES ── */
  function initParticles() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'gold-dust';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;transition:opacity 1.2s';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    function spawn() {
      return {
        x: Math.random() * W,
        y: H + Math.random() * 40,
        r: 0.6 + Math.random() * 1.8,
        vy: -0.15 - Math.random() * 0.45,
        vx: (Math.random() - 0.5) * 0.25,
        a: 0.2 + Math.random() * 0.55,
        life: 0, ttl: 400 + Math.random() * 600
      };
    }
    for (let i = 0; i < 70; i++) {
      const p = spawn();
      p.y = Math.random() * H;
      particles.push(p);
    }

    const trail = [];
    const TRAIL_LEN = 12;
    (function masterTick() {
      requestAnimationFrame(masterTick);
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life++;
        if (p.life > p.ttl || p.y < -10) Object.assign(p, spawn());
        const fade = p.life < 60 ? p.life / 60 : (p.ttl - p.life) / 60;
        ctx.fillStyle = `rgba(201,168,106,${p.a * Math.min(fade, 1)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      trail.unshift({ x: mx, y: my });
      if (trail.length > TRAIL_LEN) trail.pop();
      trail.forEach((pt, i) => {
        const a = (TRAIL_LEN - i) / TRAIL_LEN * 0.35;
        ctx.fillStyle = `rgba(201,168,106,${a})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    })();

    // Show only in dark sections
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        canvas.style.opacity = (e.isIntersecting && e.intersectionRatio > 0.25) ? '0.85' : '0';
      });
    }, { threshold: [0, 0.25, 0.6] });
    document.querySelectorAll('#values, .hs-intro-panel, #hscroll-section').forEach(s => obs.observe(s));
  }

  /* ── PHASE 4 · SCENE NUMBER CARDS (film chapter marks) ── */
  function initSceneCards() {
    const card = document.createElement('div');
    card.id = 'scene-card';
    card.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 700; pointer-events: none; opacity: 0;
      font-family: 'DM Sans', sans-serif;
      color: var(--gold); letter-spacing: .42em; text-transform: uppercase;
      font-size: 12px; text-align: center;
      transition: opacity .35s ease;
      text-shadow: 0 2px 24px rgba(0,0,0,.5);
    `;
    card.innerHTML = `<div style="font-size:11px;opacity:.6;margin-bottom:6px">— Scene <span id="sc-n"></span></div><div style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:42px;letter-spacing:-.01em;color:#fff;opacity:.92" id="sc-t"></div>`;
    document.body.appendChild(card);

    const nEl = card.querySelector('#sc-n');
    const tEl = card.querySelector('#sc-t');
    let hideT;

    document.querySelectorAll('[data-section]').forEach(sec => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 70%',
        onEnter: () => {
          nEl.textContent = sec.dataset.section;
          tEl.textContent = sec.dataset.sectionName;
          card.style.opacity = '1';
          clearTimeout(hideT);
          hideT = setTimeout(() => { card.style.opacity = '0'; }, 900);
        }
      });
    });
  }

  /* ── PHASE 3 · MAGNETIC CTAs ── */
  function initMagnetic() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.h-pill, .contact-btn, .e-btn, .ov-order, .n-dot').forEach(el => {
      const qx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      const qy = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        qx((e.clientX - cx) * 0.35);
        qy((e.clientY - cy) * 0.35);
      });
      el.addEventListener('mouseleave', () => { qx(0); qy(0); });
    });
  }

  /* ── PHASE 3 · TILT PRODUCT CARDS ── */
  function initTilt() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.prod-card').forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.style.perspective    = '900px';
      let _r = null;
      card.addEventListener('mouseenter', () => { _r = card.getBoundingClientRect(); });
      card.addEventListener('mousemove', e => {
        if (!_r) return;
        const px = (e.clientX - _r.left) / _r.width  - 0.5;
        const py = (e.clientY - _r.top)  / _r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateZ(0)`;
      });
      card.addEventListener('mouseleave', () => {
        _r = null;
        card.style.transform = 'perspective(900px) rotateY(0) rotateX(0)';
      });
    });
  }

  /* ── PHASE 3 · DARK-SECTION CURSOR SWAP ── */
  function initCursorSwap() {
    const cur  = document.getElementById('cur');
    const ring = document.getElementById('cur-ring');
    if (!cur || !ring) return;
    const darkSecs = document.querySelectorAll('#values, .hs-intro-panel, #hscroll-section');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.3) {
          cur.style.background = '#c9a86a';
          ring.style.borderColor = 'rgba(201,168,106,.5)';
        } else {
          cur.style.background = 'white';
          ring.style.borderColor = 'rgba(255,255,255,.38)';
        }
      });
    }, { threshold: [0, 0.3, 0.6] });
    darkSecs.forEach(s => obs.observe(s));
  }

  /* ── HERO PARALLAX (mouse tilt) ── */
  function initHeroParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const vid    = document.getElementById('hero-vid');
    const title  = document.querySelector('.h-title');
    const eyebrow= document.querySelector('.h-eyebrow');
    if (!vid || !title) return;
    const qxV = gsap.quickTo(vid,    'x', { duration: 0.9, ease: 'power3.out' });
    const qyV = gsap.quickTo(vid,    'y', { duration: 0.9, ease: 'power3.out' });
    const qxT = gsap.quickTo(title,  'x', { duration: 0.7, ease: 'power3.out' });
    const qyT = gsap.quickTo(title,  'y', { duration: 0.7, ease: 'power3.out' });
    const qxE = gsap.quickTo(eyebrow,'x', { duration: 0.7, ease: 'power3.out' });
    window.addEventListener('mousemove', e => {
      const cx = (e.clientX / window.innerWidth  - 0.5) * 2; // -1..1
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      qxV(cx * 18); qyV(cy * 12);     // bg drifts WITH cursor
      qxT(-cx * 22); qyT(-cy * 14);   // fg parallax OPPOSITE = depth
      qxE(-cx * 10);
    });
  }

  /* ── AUDIO-REACTIVE TITLE ── */
  function initAudioReactive() {
    const audioEl = document.getElementById('amb-track');
    const title   = document.querySelector('.h-title');
    if (!audioEl || !title) return;
    let ctx, analyser, src, data;
    audioEl.addEventListener('play', () => {
      if (ctx || REDUCED_MOTION) return; // reduced-motion: audio plays, title won't pulse
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        src = ctx.createMediaElementSource(audioEl);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        data = new Uint8Array(analyser.frequencyBinCount);
        (function tick() {
          if (!analyser) return;
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255; // 0..1
          const scale = 1 + avg * 0.018;
          title.style.transform = `scale(${scale})`;
          requestAnimationFrame(tick);
        })();
      } catch (err) {}
    });
  }

  /* ── AUDIO PILL TOGGLE ── */
  const audioBtn = document.getElementById('audio-pill');
  const audioEl  = document.getElementById('amb-track');
  if (audioBtn && audioEl) {
    audioBtn.addEventListener('click', () => {
      if (audioEl.paused) {
        audioEl.volume = 0.45;
        audioEl.play().then(() => audioBtn.classList.add('playing')).catch(() => {});
      } else {
        audioEl.pause();
        audioBtn.classList.remove('playing');
      }
    });
  }

  if (burger) {
    burger.addEventListener('click', () => {
      mobileNav.classList.add('open');
      mobileNav.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
    });
    mobileNavClose.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      mobileNav.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
    });
    // Close on link click
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

})();

/* === Ambient Audio === */
(function () {
  const audio   = document.getElementById('madinah-audio');
  const btn     = document.getElementById('ambient-toggle');
  const iconOn  = document.getElementById('ambient-icon-on');
  const iconOff = document.getElementById('ambient-icon-off');
  let playing   = false;

  audio.volume = 0.055;

  function fadeIn() {
    audio.volume = 0;
    audio.play().catch(() => {});
    let v = 0;
    const t = setInterval(() => {
      v = Math.min(v + 0.005, 0.055);
      audio.volume = v;
      if (v >= 0.055) clearInterval(t);
    }, 80);
  }

  function fadeOut(cb) {
    let v = audio.volume;
    const t = setInterval(() => {
      v = Math.max(v - 0.005, 0);
      audio.volume = v;
      if (v <= 0) { clearInterval(t); audio.pause(); if (cb) cb(); }
    }, 80);
  }

  function toggle() {
    if (!playing) {
      fadeIn();
      playing = true;
      btn.classList.add('playing');
      iconOn.style.display  = 'block';
      iconOff.style.display = 'none';
      btn.setAttribute('aria-label', 'إيقاف صوت المدينة');
    } else {
      fadeOut();
      playing = false;
      btn.classList.remove('playing');
      iconOn.style.display  = 'none';
      iconOff.style.display = 'block';
      btn.setAttribute('aria-label', 'تشغيل صوت المدينة');
    }
  }

  btn.addEventListener('click', toggle);

  // Auto-start on first scroll (browsers allow audio after any interaction)
  let autoStarted = false;
  window.addEventListener('scroll', function onScroll() {
    if (!autoStarted) {
      autoStarted = true;
      window.removeEventListener('scroll', onScroll);
      fadeIn();
      playing = true;
      btn.classList.add('playing');
      iconOn.style.display  = 'block';
      iconOff.style.display = 'none';
      btn.setAttribute('aria-label', 'إيقاف صوت المدينة');
    }
  }, { passive: true });
})();
