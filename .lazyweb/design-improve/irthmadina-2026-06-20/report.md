# Design Improvement: irthmadina.com — Full Polish Plan

**Date:** 2026-06-20
**Site:** https://www.irth-house.com
**Score before:** Aesthetics 9/10 · UX 7/10 · Conversion 6.5/10 · Perf 6/10
**Target:** Aesthetics 9/10 · UX 8.5/10 · Conversion 8/10 · Perf 8/10

---

## TL;DR

Three root causes hold the site back: (1) hero video destroys LCP making the site *feel* slow before the luxury experience even loads, (2) scroll animations are CSS-only when Lenis+GSAP would give cinematic buttery motion, (3) conversion path is 3+ clicks deep with no price signal. Fix performance first, then scroll polish, then conversion nudges.

---

## What's Working — Do NOT Touch

- Entry screen / "Enter without audio" ritual — unique differentiator
- Opening Ritual box drag interaction — cinematic, on-brand
- Section numbering system (01, 02, 03)
- Marquee rhythm (now ink-colored)
- Bilingual headline system (AR primary / EN secondary)
- Color system: ivory #F3EFE7 / ink #111111 / gold #B89B5E / madinah #0E2B22
- Sourcing strip as sole green section
- Gift category labels

---

## Improvement 1 — Hero Video LCP Fix ⭐ CRITICAL

**Problem:** Video backgrounds add 2–5s to LCP. Browser cannot use `<video>` as LCP candidate. If poster missing → LCP = blank screen for 4+ seconds.

**Fix in hero section:**
```liquid
<link rel="preload" as="image"
  href="{{ 'hero-poster.jpg' | asset_url }}"
  fetchpriority="high">

<video autoplay muted loop playsinline
  poster="{{ 'hero-poster.jpg' | asset_url }}"
  preload="none"
  aria-hidden="true">
  <source src="{{ section.settings.video_url }}" type="video/mp4">
</video>
```

**On mobile** — replace video entirely:
```css
@media (max-width: 768px) {
  .hero-video { display: none; }
  .hero-poster-mobile { display: block; background: url('hero-poster-mobile.jpg') center/cover; }
}
```

**Expected gain:** LCP 4s → 1.5s desktop. Mobile 5s → 2s.

---

## Improvement 2 — Lenis Smooth Scroll ⭐ HIGH

**Problem:** Native browser scroll feels jumpy on a cinematic site. Lenis + GSAP = industry standard for luxury experiences.

**Add before `</body>` in `theme.liquid`:**
```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script>
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const lenis = new Lenis({
      duration: 1.4,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
</script>
```

**Sketch:**
```
WITHOUT:  Scroll ──── jump ──── section appears instantly
WITH:     Scroll ~~~~ glide ~~~~ section floats in over 400ms
```

---

## Improvement 3 — Fix img Width/Height (CLS)

**Problem:** 10 img tags missing width/height → browser can't reserve space → layout shifts → CLS penalty → Google ranking hit.

**Pattern:**
```liquid
{{- image | image_url: width: 800 | image_tag:
    width: image.width, height: image.height,
    loading: 'lazy', widths: '375, 600, 800, 1200'
-}}
```

Above fold: `loading: 'eager'`, `fetchpriority: 'high'`

**Expected gain:** CLS 0.3 → <0.1 (Google "Good")

---

## Improvement 4 — Price Signal on Collection Cards

**Problem:** "VIEW →" with no price = 3 clicks before visitor knows if they can afford it. Luxury ≠ hiding prices.

**In `collection-grid.liquid`:**
```liquid
{% if card_product.price_min %}
<span class="card-price">from {{ card_product.price_min | money }}</span>
{% endif %}
```

```css
.card-price {
  font-family: 'Suisse Intl', sans-serif;
  font-size: 11px; letter-spacing: .08em;
  color: var(--gold); opacity: .7;
}
```

**Card before:**
```
┌──────────┐     ┌──────────┐
│  [image] │     │  [image] │
│  التمور  │  →  │  التمور  │
│  VIEW →  │     │  from £18│
└──────────┘     │  اكتشف ↘│
                 └──────────┘
```

---

## Improvement 5 — Arabic Font Preload (FOIT Fix)

**Problem:** Noto Naskh Arabic loads late → invisible text flash → CLS spike on Arabic content.

**In `theme.liquid` `<head>`:**
```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600&display=swap">
```

Add `font-display: swap` to all `@font-face` declarations.

---

## Improvement 6 — Mobile Parallax Disable

**Problem:** Parallax transforms on mobile = janky 30fps, battery drain.

```css
@media (max-width: 768px) {
  [data-parallax] { transform: none !important; }
  .fade-up { animation-duration: .3s; }
  .hero-video-wrap video { display: none; }
}
```

---

## Improvement 7 — Gift Section Imagery

**Problem:** Gift tier cards (Classic / Signature / Royal) have no photography — highest-intent section with no visual confidence builder.

**Needed from client:**
- `gift-classic.jpg` — wooden box open, velvet interior, wax seal
- `gift-signature.jpg` — gold box, embossed name
- `gift-royal.jpg` — full set, dried rose petals, Arabic calligraphy card

Until photos: add dark texture placeholder so the section doesn't feel empty.

---

## Priority Matrix

| # | Fix | Impact | Effort | Ship order |
|---|-----|--------|--------|-----------|
| 1 | Hero video LCP + poster image | Critical | Medium | 1st |
| 2 | Lenis smooth scroll | High | Low | 1st |
| 3 | img width/height CLS | High | Low | 1st |
| 4 | Price on collection cards | Medium | Low | 2nd |
| 5 | Arabic font preload | Medium | Very low | 1st |
| 6 | Mobile parallax disable | High | Low | 1st |
| 7 | Gift section imagery | Medium | Needs photos | When ready |

---

## Atmosphere × Commerce Target

```
Current:   [████████░░] 85% atmosphere · 15% commerce
Target:    [██████░░░░] 65% atmosphere · 35% commerce

Fix 4 (price) moves needle — quietly, in gold, not red.
Commerce should whisper, not shout.
```

---

*Sources: Shopify Performance Blog · Lenis.dev · DebugBear Shopify Speed Guide · convertcart.com luxury UX*
