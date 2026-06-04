# Google Search Console -- IRTH Setup Guide

## 1. Add GSC property

1. https://search.google.com/search-console → **Add property**
2. Choose **Domain** (covers all subdomains + http/https)
   - Enter: `irthmadina.com`
3. Google shows a DNS TXT record — add in Cloudflare:
   - Type: `TXT` · Name: `@` · Value: `google-site-verification=XXXXXXXX` · TTL: Auto
4. Click **Verify** (usually <15 min on Cloudflare)

**Alternative — HTML meta tag (faster):**
1. GSC → URL prefix → `https://www.irthmadina.com`
2. Expand "HTML tag" method → copy only the `content="..."` value
3. Shopify Admin → Themes → Customize → Theme Settings → **SEO & Analytics**
4. Paste into **GSC verification code** → Save → Verify in GSC

---

## 2. Submit sitemap

GSC → Sitemaps → enter `sitemap.xml` → **Submit**

Shopify auto-generates `/sitemap.xml` covering products, collections, pages, blogs.

---

## 3. Add GA4

1. https://analytics.google.com → create property → `irthmadina.com`
2. Copy Measurement ID (`G-XXXXXXXXXX`)
3. Shopify Admin → Themes → Customize → Theme Settings → **SEO & Analytics**
4. Paste into **GA4 Measurement ID** → Save
5. Verify: GA4 → Realtime → visit site → confirm event

Link GA4 to GSC: GA4 → Admin → Search Console Links → Link → select property.

---

## 4. Request indexing (priority pages)

GSC → URL Inspection → paste URL → **Request Indexing**

| URL |
|-----|
| `https://www.irthmadina.com/` |
| `https://www.irthmadina.com/collections/all` |
| `https://www.irthmadina.com/products/ajwa-dates` |
| `https://www.irthmadina.com/products/sukkari-dates` |

---

## 5. Target queries to monitor

**Arabic:** تمور عجوة · تمور سكري · تمور فاخرة · تمور المدينة المنورة · هدايا تمور للشركات · تمور جملة

**English:** ajwa dates buy · premium dates wholesale · madinah dates UK · corporate date gifts · sukkari dates supplier

---

## 6. Verify robots.txt

After deploy: `https://www.irthmadina.com/robots.txt`

Should show `Sitemap: https://www.irthmadina.com/sitemap.xml` at bottom.

---

## 7. Core Web Vitals

GSC → Experience → Core Web Vitals
- LCP < 2.5s · INP < 200ms · CLS < 0.1
- Phase 5 `srcset` + `fetchpriority` improvements target collection page LCP
- Check mobile separately from desktop
