#!/usr/bin/env node
/**
 * IRTH Phase 1 — Shopify Admin GraphQL catalog creation script
 * Creates 3 primary collections + 29 products with variants + metafields
 *
 * Usage:
 *   SHOPIFY_STORE=irthmadina.myshopify.com \
 *   SHOPIFY_TOKEN=shpat_xxxx \
 *   node scripts/phase1-create-catalog.mjs
 *
 * Requires: Node 18+ (native fetch)
 * Scopes needed: write_products, read_products
 */

const STORE  = process.env.SHOPIFY_STORE;
const TOKEN  = process.env.SHOPIFY_TOKEN;
const API_VER = '2025-01';

if (!STORE || !TOKEN) {
  console.error('❌  Set SHOPIFY_STORE and SHOPIFY_TOKEN env vars');
  process.exit(1);
}

const ENDPOINT = `https://${STORE}/admin/api/${API_VER}/graphql.json`;

/* ── GraphQL helper ──────────────────────────────────────────────────── */
async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: {
      'Content-Type':            'application/json',
      'X-Shopify-Access-Token':  TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors.map(e => e.message).join('\n'));
  return data;
}

/* Rate-limit: ~1 req/s (conservative, GraphQL bucket = 1000 pts/s) */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── Mutations ───────────────────────────────────────────────────────── */
const CREATE_COLLECTION = /* graphql */ `
  mutation CreateCollection($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection { id handle title }
      userErrors  { field message }
    }
  }
`;

const CREATE_PRODUCT = /* graphql */ `
  mutation CreateProduct($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        id handle title status
        variants(first: 10) { nodes { id sku } }
      }
      userErrors { field message }
    }
  }
`;

const ADD_TO_COLLECTION = /* graphql */ `
  mutation AddToCollection($id: ID!, $productIds: [ID!]!) {
    collectionAddProducts(id: $id, productIds: $productIds) {
      collection { id productsCount { count } }
      userErrors  { field message }
    }
  }
`;

/* ── Collection data ─────────────────────────────────────────────────── */
const COLLECTIONS = [
  {
    handle: 'dates',
    title:  'التمر — Dates',
    seo: {
      title:       'تمور المدينة الفاخرة | مجول وعجوة وتمر محشي — إرث',
      description: 'اكتشف أجود تمور المدينة المنورة — عجوة، مجول، رطب، محشي، ومتغطي. إرث — من وحي المدينة.',
    },
  },
  {
    handle: 'madinah-herbs',
    title:  'أعشاب المدينة — Madinah Herbs',
    seo: {
      title:       'أعشاب المدينة المنورة الأصيلة | زعفران ونعناع وورد وسدر — إرث',
      description: 'أعشاب طبيعية أصيلة من المدينة المنورة. إرث — من وحي المدينة.',
    },
  },
  {
    handle: 'spirit-of-madinah',
    title:  'روح المدينة — Spirit of Madinah',
    seo: {
      title:       'روح المدينة | سبح وسجاد صلاة وعطور وبخور — إرث',
      description: 'اقتني روح المدينة المنورة في بيتك. إرث — من وحي المدينة.',
    },
  },
  {
    handle: 'gift-boxes',
    title:  'صناديق الهدايا — Gift Boxes',
    seo: {
      title:       'صناديق هدايا فاخرة من المدينة المنورة — إرث',
      description: 'صناديق هدايا فاخرة من إرث — لكل مناسبة.',
    },
  },
  {
    handle: 'new-arrivals',
    title:  'تشكيلة الإطلاق — Launch Collection',
    seo: {
      title: 'تشكيلة الإطلاق — الجديد من إرث',
      description: 'أحدث منتجات إرث — تمور، أعشاب، سبح، وهدايا.',
    },
  },
];

/* ── Product data ────────────────────────────────────────────────────── */
const PRODUCTS = [
  /* ══ DATES ══════════════════════════════════════════════════════ */
  {
    handle: 'medjool-dates-premium',
    title:  'تمر المجول الفاخر — Premium Medjool Dates',
    vendor: 'IRTH إرث', productType: 'Dates — تمور', status: 'ACTIVE',
    tags:   ['dates','medjool','gift','premium','launch'],
    descriptionHtml: '<p dir="rtl">ملك التمور في صندوق خشب مُحفور بالليزر. مصدر موثق من مزارع المدينة المنورة.</p>',
    seo:    { title: 'تمر المجول الفاخر من المدينة | صندوق خشب — إرث', description: 'تمر مجول من الدرجة الأولى في صندوق خشب. هدية لائقة بكل مناسبة. توصيل 24–48 ساعة في مصر.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name',     type: 'single_line_text_field', value: 'تمر المجول الفاخر' },
      { namespace: 'irth', key: 'origin',          type: 'single_line_text_field', value: 'المدينة المنورة — Saudi Arabia' },
      { namespace: 'irth', key: 'hadith_reference',type: 'single_line_text_field', value: 'ملك التمور — هدية راقية تعبّر عن أرقى معاني الكرم في التراث الإسلامي' },
    ],
    productOptions: [{ name: 'Weight', values: [{ name: '500g — صندوق خشب' }, { name: '1kg — صندوق خشب' }] }],
    variants: [
      { price: '850.00',  sku: 'IRTH-DATE-MJD-500W', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '1500.00', sku: 'IRTH-DATE-MJD-1KW',  inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['dates','gift-boxes','new-arrivals'],
  },
  {
    handle: 'ajwa-madinah-dates',
    title:  'تمر العجوة المدينية — Ajwa Al-Madinah Dates',
    vendor: 'IRTH إرث', productType: 'Dates — تمور', status: 'ACTIVE',
    tags:   ['dates','ajwa','madinah','prophetic','gift','launch','ramadan'],
    descriptionHtml: '<p dir="rtl">تمر العجوة من مزارع المدينة المنورة المعتمدة. «من تصبّح بسبع تمرات عجوة...» — حديث صحيح.</p>',
    seo:    { title: 'عجوة المدينة المنورة الأصيلة | تمر نبوي موثق — إرث', description: 'تمر العجوة من مزارع المدينة المعتمدة. توصيل لمصر والخليج.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name',     type: 'single_line_text_field', value: 'تمر العجوة المدينية' },
      { namespace: 'irth', key: 'origin',          type: 'single_line_text_field', value: 'مزارع المدينة المنورة — Madinah Al-Munawwarah' },
      { namespace: 'irth', key: 'hadith_reference',type: 'single_line_text_field', value: 'مَنْ تَصَبَّحَ بِسَبْعِ تَمَرَاتٍ عَجْوَةً، لَمْ يَضُرَّهُ ذَلِكَ الْيَوْمَ سُمٌّ وَلاَ سِحْرٌ — متفق عليه' },
    ],
    productOptions: [{ name: 'Weight', values: [{ name: '400g' }, { name: '800g — علبة فاخرة' }] }],
    variants: [
      { price: '550.00', sku: 'IRTH-DATE-AJW-400',  inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '980.00', sku: 'IRTH-DATE-AJW-800L', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['dates','gift-boxes','new-arrivals'],
  },
  {
    handle: 'maftel-dates',
    title:  'تمر المفتل الحجازي — Maftel Hijazi Dates',
    vendor: 'IRTH إرث', productType: 'Dates — تمور', status: 'ACTIVE',
    tags:   ['dates','maftel','hijazi','traditional'],
    descriptionHtml: '<p dir="rtl">تمر المفتل الحجازي — تمر تقليدي أصيل من أرض الحجاز بنكهته المميزة.</p>',
    seo:    { title: 'تمر المفتل الحجازي | تمر تقليدي أصيل — إرث', description: 'تمر المفتل الحجازي — تمر تقليدي أصيل، مصدر موثق، تغليف فاخر.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'تمر المفتل الحجازي' },
      { namespace: 'irth', key: 'origin',      type: 'single_line_text_field', value: 'الحجاز — Al-Hijaz, Saudi Arabia' },
    ],
    productOptions: [{ name: 'Weight', values: [{ name: '400g' }] }],
    variants: [{ price: '420.00', sku: 'IRTH-DATE-MFT-400', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['dates','new-arrivals'],
  },
  {
    handle: 'fresh-rutab-dates',
    title:  'رطب المدينة الطازج — Fresh Madinah Rutab',
    vendor: 'IRTH إرث', productType: 'Dates — تمور', status: 'ACTIVE',
    tags:   ['dates','rutab','fresh','madinah','seasonal'],
    descriptionHtml: '<p dir="rtl">رطب طازج من مزارع المدينة المنورة — اللحظة اللي بيكون فيها التمر في أحلى حالاته.</p>',
    seo:    { title: 'رطب المدينة الطازج | رطب طازج من الحجاز — إرث', description: 'رطب طازج من مزارع المدينة المنورة.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'رطب المدينة الطازج' },
      { namespace: 'irth', key: 'origin',      type: 'single_line_text_field', value: 'مزارع المدينة المنورة — Madinah Al-Munawwarah' },
    ],
    productOptions: [{ name: 'Weight', values: [{ name: '300g' }, { name: '500g' }] }],
    variants: [
      { price: '380.00', sku: 'IRTH-DATE-RTB-300', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '590.00', sku: 'IRTH-DATE-RTB-500', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['dates','new-arrivals'],
  },
  {
    handle: 'stuffed-dates-premium',
    title:  'تمور محشية فاخرة — Premium Stuffed Dates',
    vendor: 'IRTH إرث', productType: 'Dates — تمور', status: 'ACTIVE',
    tags:   ['dates','stuffed','gift','luxury','premium','nuts'],
    descriptionHtml: '<p dir="rtl">تمور مجول فاخرة محشية بأجود أنواع المكسرات. هدية الكرم والضيافة.</p>',
    seo:    { title: 'تمور محشية فاخرة | مجول محشي لوز وجوز وفستق — إرث', description: 'تمور مجول فاخرة محشية بأجود المكسرات في تغليف فاخر.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'تمور محشية فاخرة' },
    ],
    productOptions: [{ name: 'Filling', values: [{ name: '300g — محشي لوز' }, { name: '300g — محشي جوز' }, { name: '300g — محشي فستق' }, { name: '300g — تشكيلة مشكلة' }] }],
    variants: [
      { price: '750.00', sku: 'IRTH-DATE-STF-ALM', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '750.00', sku: 'IRTH-DATE-STF-WLN', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '790.00', sku: 'IRTH-DATE-STF-PST', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '800.00', sku: 'IRTH-DATE-STF-MIX', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['dates','gift-boxes'],
  },
  {
    handle: 'coated-dates-chocolate',
    title:  'تمور متغطية بالشوكولاتة — Chocolate Coated Dates',
    vendor: 'IRTH إرث', productType: 'Dates — تمور', status: 'ACTIVE',
    tags:   ['dates','coated','chocolate','gift','luxury','ramadan'],
    descriptionHtml: '<p dir="rtl">تمور مجول متغطية بأجود أنواع الشوكولاتة الداكنة والبيضاء.</p>',
    seo:    { title: 'تمور متغطية بالشوكولاتة الفاخرة | هدية مميزة — إرث', description: 'تمور مجول متغطية بالشوكولاتة الداكنة والبيضاء. هدية مثالية.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'تمور متغطية بالشوكولاتة' },
    ],
    productOptions: [{ name: 'Type', values: [{ name: '200g — شوكولاتة داكنة' }, { name: '200g — شوكولاتة بيضاء' }, { name: '200g — مشكل' }] }],
    variants: [
      { price: '480.00', sku: 'IRTH-DATE-COT-DRK', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '480.00', sku: 'IRTH-DATE-COT-WHT', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '490.00', sku: 'IRTH-DATE-COT-MIX', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['dates','gift-boxes'],
  },

  /* ══ HERBS ═══════════════════════════════════════════════════════ */
  {
    handle: 'madinah-mint-dried',
    title:  'نعناع المدينة المنورة المجفف — Dried Madinah Mint',
    vendor: 'IRTH إرث', productType: 'Herbs — أعشاب', status: 'ACTIVE',
    tags:   ['herbs','mint','madinah','wellness','launch'],
    descriptionHtml: '<p dir="rtl">نعناع مجفف من مزارع المدينة المنورة — رائحة وطعم لا يشبهه شيء. طبيعي 100%.</p>',
    seo:    { title: 'نعناع المدينة المجفف | أعشاب طبيعية أصيلة — إرث', description: 'نعناع مجفف من مزارع المدينة المنورة. طبيعي 100%، بدون إضافات.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'نعناع المدينة المنورة' },
      { namespace: 'irth', key: 'origin',      type: 'single_line_text_field', value: 'مزارع المدينة المنورة — Madinah Al-Munawwarah' },
    ],
    productOptions: [{ name: 'Weight', values: [{ name: '50g' }] }],
    variants: [{ price: '250.00', sku: 'IRTH-HERB-MNT-50', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['madinah-herbs','new-arrivals'],
  },
  {
    handle: 'madinah-basil-dried',
    title:  'حبق المدينة المنورة المجفف — Dried Madinah Basil',
    vendor: 'IRTH إرث', productType: 'Herbs — أعشاب', status: 'ACTIVE',
    tags:   ['herbs','basil','madinah','wellness','launch'],
    descriptionHtml: '<p dir="rtl">حبق مجفف من أرض المدينة المنورة الطيبة. رائحة عطرية تذكّر بحدائق الحجاز.</p>',
    seo:    { title: 'حبق المدينة المنورة | أعشاب طبيعية مجففة — إرث', description: 'حبق مجفف طبيعي من المدينة المنورة. نقي وأصيل.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'حبق المدينة المنورة' },
      { namespace: 'irth', key: 'origin',      type: 'single_line_text_field', value: 'المدينة المنورة — Madinah Al-Munawwarah' },
    ],
    productOptions: [{ name: 'Weight', values: [{ name: '40g' }] }],
    variants: [{ price: '260.00', sku: 'IRTH-HERB-BSL-40', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['madinah-herbs','new-arrivals'],
  },
  {
    handle: 'taif-rose-dried-petals',
    title:  'ورد الطائف المجفف — Dried Taif Rose Petals',
    vendor: 'IRTH إرث', productType: 'Herbs — أعشاب', status: 'ACTIVE',
    tags:   ['herbs','rose','taif','wellness','fragrance','launch','gift'],
    descriptionHtml: '<p dir="rtl">ورد الطائف المجفف — أعطر وردة في الجزيرة العربية، من مزارع الطائف الشهيرة.</p>',
    seo:    { title: 'ورد الطائف المجفف | وردة الإمبراطور من مكة — إرث', description: 'ورد الطائف المجفف من مزارع الطائف. يُستخدم في الشاي، العطور، والاسترخاء.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'ورد الطائف المجفف' },
      { namespace: 'irth', key: 'origin',      type: 'single_line_text_field', value: 'مزارع الطائف — Al-Taif, Saudi Arabia' },
    ],
    productOptions: [{ name: 'Weight', values: [{ name: '20g' }] }],
    variants: [{ price: '450.00', sku: 'IRTH-HERB-RSE-20', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['madinah-herbs','gift-boxes','new-arrivals'],
  },
  {
    handle: 'premium-saffron-full-petal',
    title:  'الزعفران الممتاز كامل الأوتار — Premium Full Petal Saffron',
    vendor: 'IRTH إرث', productType: 'Herbs — أعشاب', status: 'ACTIVE',
    tags:   ['herbs','saffron','premium','gift','luxury','launch'],
    descriptionHtml: '<p dir="rtl">زعفران من الدرجة الأولى كامل الأوتار — أغلى بهارات العالم في علبة فاخرة من إرث.</p>',
    seo:    { title: 'الزعفران الممتاز كامل الأوتار | زعفران أصيل — إرث', description: 'زعفران Grade A من الدرجة الأولى في علبة فاخرة. هدية راقية بكل المقاييس.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'الزعفران الممتاز' },
      { namespace: 'irth', key: 'origin',      type: 'single_line_text_field', value: 'إيران أو كشمير — Grade A Premium' },
    ],
    productOptions: [{ name: 'Weight', values: [{ name: '1g — علبة فاخرة' }, { name: '3g — علبة فاخرة' }] }],
    variants: [
      { price: '580.00',  sku: 'IRTH-HERB-SFR-1G', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '1550.00', sku: 'IRTH-HERB-SFR-3G', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['madinah-herbs','gift-boxes','new-arrivals'],
  },
  {
    handle: 'sidr-lote-powder-premium',
    title:  'مسحوق السدر الممتاز — Premium Sidr Lote Tree Powder',
    vendor: 'IRTH إرث', productType: 'Herbs — أعشاب', status: 'ACTIVE',
    tags:   ['herbs','sidr','wellness','prophetic','launch','hair-care'],
    descriptionHtml: '<p dir="rtl">مسحوق السدر الممتاز، مطحون سبع مرات — مذكور في القرآن الكريم. وَسِدْرٍ مَّخْضُودٍ.</p>',
    seo:    { title: 'مسحوق السدر النبوي | سدر طحن سبع مرات — إرث', description: 'مسحوق السدر الممتاز، مطحون سبع مرات. للغسيل والعناية بالشعر.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name',     type: 'single_line_text_field', value: 'مسحوق السدر الممتاز' },
      { namespace: 'irth', key: 'origin',          type: 'single_line_text_field', value: 'الجزيرة العربية — Saudi Arabia' },
      { namespace: 'irth', key: 'hadith_reference',type: 'single_line_text_field', value: 'وَسِدْرٍ مَّخْضُودٍ — القرآن الكريم (سورة الواقعة: ٢٨)' },
    ],
    productOptions: [{ name: 'Weight', values: [{ name: '200g — طحن سبع مرات' }] }],
    variants: [{ price: '380.00', sku: 'IRTH-HERB-SDR-200S', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['madinah-herbs','new-arrivals'],
  },

  /* ══ SPIRIT OF MADINAH — MISBAHAS ═══════════════════════════════ */
  {
    handle: 'misbaha-ard-al-haram',
    title:  'سبحة أرض الحرم — Ard Al-Haram Misbaha',
    vendor: 'IRTH إرث', productType: 'Misbaha — سبحة', status: 'ACTIVE',
    tags:   ['misbaha','prayer-beads','haram','gift','spirit-madinah','launch'],
    descriptionHtml: '<p dir="rtl">سبحة مستوحاة من أرض الحرم المكي المشرف. مواد طبيعية فاخرة، خيط حرير، في صندوق مخمل.</p>',
    seo:    { title: 'سبحة أرض الحرم الفاخرة | سبح إسلامية — إرث', description: 'سبحة مستوحاة من أرض الحرم المكي. خيط حرير، صندوق مخمل. هدية إسلامية راقية.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name',  type: 'single_line_text_field', value: 'سبحة أرض الحرم' },
      { namespace: 'irth', key: 'inspiration',  type: 'single_line_text_field', value: 'أرض الحرم المكي المشرف' },
    ],
    productOptions: [{ name: 'Beads', values: [{ name: '33 حبة — صندوق مخمل' }, { name: '99 حبة — صندوق مخمل' }] }],
    variants: [
      { price: '850.00',  sku: 'IRTH-MSB-HRAM-33', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '1200.00', sku: 'IRTH-MSB-HRAM-99', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['spirit-of-madinah','gift-boxes','new-arrivals'],
  },
  {
    handle: 'misbaha-al-hajar-al-aswad',
    title:  'سبحة الحجر الأسود — Al-Hajar Al-Aswad Misbaha',
    vendor: 'IRTH إرث', productType: 'Misbaha — سبحة', status: 'ACTIVE',
    tags:   ['misbaha','black-stone','gift','spirit-madinah','launch'],
    descriptionHtml: '<p dir="rtl">سبحة مستوحاة من الحجر الأسود المعظم. تصميم أسود عميق مع تفاصيل ذهبية. في علبة جلد فاخرة.</p>',
    seo:    { title: 'سبحة الحجر الأسود | سبحة فاخرة — إرث', description: 'سبحة مستوحاة من الحجر الأسود. في علبة جلد فاخرة.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'سبحة الحجر الأسود' }],
    productOptions: [{ name: 'Beads', values: [{ name: '33 حبة — صندوق جلد' }] }],
    variants: [{ price: '950.00', sku: 'IRTH-MSB-HJRS-33', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['spirit-of-madinah','gift-boxes'],
  },
  {
    handle: 'misbaha-qandeel-al-kaaba',
    title:  'سبحة قنديل الكعبة — Qandeel Al-Kaaba Misbaha',
    vendor: 'IRTH إرث', productType: 'Misbaha — سبحة', status: 'ACTIVE',
    tags:   ['misbaha','kaaba','gold','luxury','gift','spirit-madinah'],
    descriptionHtml: '<p dir="rtl">سبحة قنديل الكعبة — تصميم ذهبي مستوحى من قناديل الكعبة المشرفة.</p>',
    seo:    { title: 'سبحة قنديل الكعبة الذهبية | سبحة فاخرة — إرث', description: 'سبحة بتصميم ذهبي مستوحى من قناديل الكعبة المشرفة.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'سبحة قنديل الكعبة' }],
    productOptions: [{ name: 'Beads', values: [{ name: '33 حبة — صندوق ذهبي' }] }],
    variants: [{ price: '1100.00', sku: 'IRTH-MSB-QNDL-33', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['spirit-of-madinah','gift-boxes'],
  },
  {
    handle: 'misbaha-jabal-uhud',
    title:  'سبحة جبل أحد — Jabal Uhud Misbaha',
    vendor: 'IRTH إرث', productType: 'Misbaha — سبحة', status: 'ACTIVE',
    tags:   ['misbaha','uhud','madinah','gift','spirit-madinah'],
    descriptionHtml: '<p dir="rtl">سبحة مستوحاة من جبل أحد بالمدينة المنورة. ألوان طبيعية تعكس هيبة الجبل المبارك.</p>',
    seo:    { title: 'سبحة جبل أحد | سبحة إسلامية فاخرة — إرث', description: 'سبحة مستوحاة من جبل أحد بالمدينة المنورة.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'سبحة جبل أحد' }],
    productOptions: [{ name: 'Beads', values: [{ name: '33 حبة — صندوق مخمل' }] }],
    variants: [{ price: '780.00', sku: 'IRTH-MSB-UHUD-33', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['spirit-of-madinah','gift-boxes'],
  },
  {
    handle: 'misbaha-shadharwan-al-kaaba',
    title:  'سبحة شذروان الكعبة — Shadharwan Al-Kaaba Misbaha',
    vendor: 'IRTH إرث', productType: 'Misbaha — سبحة', status: 'ACTIVE',
    tags:   ['misbaha','kaaba','shadharwan','luxury','gift','spirit-madinah'],
    descriptionHtml: '<p dir="rtl">سبحة مستوحاة من شذروان الكعبة المشرفة. في صندوق جلد منقوش.</p>',
    seo:    { title: 'سبحة شذروان الكعبة الفاخرة | سبح مميزة — إرث', description: 'سبحة شذروان الكعبة في صندوق جلد منقوش.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'سبحة شذروان الكعبة' }],
    productOptions: [{ name: 'Beads', values: [{ name: '33 حبة — صندوق جلد' }] }],
    variants: [{ price: '1050.00', sku: 'IRTH-MSB-SHDW-33', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['spirit-of-madinah','gift-boxes'],
  },
  {
    handle: 'misbaha-bab-al-salam',
    title:  'سبحة باب السلام — Bab Al-Salam Misbaha',
    vendor: 'IRTH إرث', productType: 'Misbaha — سبحة', status: 'ACTIVE',
    tags:   ['misbaha','bab-al-salam','madinah','gift','spirit-madinah'],
    descriptionHtml: '<p dir="rtl">سبحة باب السلام — مستوحاة من باب السلام الشريف في المسجد النبوي.</p>',
    seo:    { title: 'سبحة باب السلام | سبحة مدينية فاخرة — إرث', description: 'سبحة مستوحاة من باب السلام في المسجد النبوي.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'سبحة باب السلام' }],
    productOptions: [{ name: 'Beads', values: [{ name: '33 حبة — صندوق مخمل' }] }],
    variants: [{ price: '820.00', sku: 'IRTH-MSB-SLAM-33', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['spirit-of-madinah','gift-boxes'],
  },
  {
    handle: 'misbaha-bab-al-aqeeq',
    title:  'سبحة باب العقيق — Bab Al-Aqeeq Misbaha',
    vendor: 'IRTH إرث', productType: 'Misbaha — سبحة', status: 'ACTIVE',
    tags:   ['misbaha','aqeeq','yemeni','carnelian','luxury','gift','spirit-madinah','launch'],
    descriptionHtml: '<p dir="rtl">سبحة العقيق اليماني الأصيل — مستوحاة من باب العقيق بالمدينة المنورة.</p>',
    seo:    { title: 'سبحة العقيق اليماني | سبحة باب العقيق — إرث', description: 'سبحة العقيق اليماني الأصيل. حجر كريم طبيعي + خيط حرير + صندوق جلد.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name',     type: 'single_line_text_field', value: 'سبحة باب العقيق — عقيق يماني' },
      { namespace: 'irth', key: 'hadith_reference', type: 'single_line_text_field', value: 'عليكم بالعقيق فإنه ينفي الفقر — أثر نبوي' },
    ],
    productOptions: [{ name: 'Stone', values: [{ name: '33 حبة عقيق يماني — صندوق جلد' }, { name: '33 حبة عقيق طبيعي — صندوق مخمل' }] }],
    variants: [
      { price: '1800.00', sku: 'IRTH-MSB-AQIQ-33Y', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '980.00',  sku: 'IRTH-MSB-AQIQ-33N', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['spirit-of-madinah','gift-boxes','new-arrivals'],
  },

  /* ══ SPIRIT — PRAYER RUGS ══════════════════════════════════════ */
  {
    handle: 'prayer-rug-rawdah-boundaries',
    title:  'سجادة صلاة حدود الروضة الشريفة — Al-Rawdah Prayer Rug',
    vendor: 'IRTH إرث', productType: 'Prayer Rug — سجادة صلاة', status: 'ACTIVE',
    tags:   ['prayer-rug','rawdah','madinah','gift','spirit-madinah','launch'],
    descriptionHtml: '<p dir="rtl">سجادة صلاة بتصميم حدود الروضة الشريفة. «ما بين بيتي ومنبري روضة من رياض الجنة».</p>',
    seo:    { title: 'سجادة صلاة حدود الروضة الشريفة | سجاد مدينية فاخر — إرث', description: 'سجادة صلاة بتصميم الروضة الشريفة. مخمل تركي فاخر في حقيبة جلد.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name',  type: 'single_line_text_field', value: 'سجادة صلاة حدود الروضة الشريفة' },
      { namespace: 'irth', key: 'inspiration',  type: 'single_line_text_field', value: 'الروضة الشريفة في المسجد النبوي' },
      { namespace: 'irth', key: 'hadith_reference', type: 'single_line_text_field', value: 'ما بين بيتي ومنبري روضة من رياض الجنة — متفق عليه' },
    ],
    productOptions: [{ name: 'Material', values: [{ name: 'مخمل تركي — حقيبة جلد' }, { name: 'حرير طبيعي — صندوق فاخر' }] }],
    variants: [
      { price: '950.00',  sku: 'IRTH-RUG-RWDH-VLV', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '1800.00', sku: 'IRTH-RUG-RWDH-SLK', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['spirit-of-madinah','gift-boxes','new-arrivals'],
  },
  {
    handle: 'prayer-rug-quba-mosque',
    title:  'سجادة صلاة مسجد قباء — Quba Mosque Prayer Rug',
    vendor: 'IRTH إرث', productType: 'Prayer Rug — سجادة صلاة', status: 'ACTIVE',
    tags:   ['prayer-rug','quba','madinah','gift','spirit-madinah'],
    descriptionHtml: '<p dir="rtl">سجادة صلاة بتصميم مسجد قباء — أول مسجد بُني في الإسلام بيد النبي ﷺ.</p>',
    seo:    { title: 'سجادة صلاة مسجد قباء | أول مسجد في الإسلام — إرث', description: 'سجادة صلاة بتصميم مسجد قباء. تغليف فاخر.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'سجادة صلاة مسجد قباء' }],
    productOptions: [{ name: 'Material', values: [{ name: 'مخمل تركي — حقيبة جلد' }] }],
    variants: [{ price: '850.00', sku: 'IRTH-RUG-QUBA-VLV', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['spirit-of-madinah','gift-boxes'],
  },
  {
    handle: 'prayer-rug-dhul-qiblatayn',
    title:  'سجادة صلاة ذو القبلتين — Dhul Qiblatayn Prayer Rug',
    vendor: 'IRTH إرث', productType: 'Prayer Rug — سجادة صلاة', status: 'ACTIVE',
    tags:   ['prayer-rug','dhul-qiblatayn','madinah','gift','spirit-madinah'],
    descriptionHtml: '<p dir="rtl">سجادة صلاة بتصميم مسجد ذو القبلتين — المسجد الذي تحولت فيه القبلة.</p>',
    seo:    { title: 'سجادة صلاة ذو القبلتين | مسجد القبلتين — إرث', description: 'سجادة صلاة بتصميم مسجد ذو القبلتين. تاريخ إسلامي في تصميم فاخر.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'سجادة صلاة ذو القبلتين' }],
    productOptions: [{ name: 'Material', values: [{ name: 'مخمل تركي — حقيبة جلد' }] }],
    variants: [{ price: '880.00', sku: 'IRTH-RUG-DQLB-VLV', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['spirit-of-madinah','gift-boxes'],
  },

  /* ══ SPIRIT — REMAINING PRODUCTS ═══════════════════════════════ */
  {
    handle: 'laser-engraved-quran-stand',
    title:  'حامل المصحف الشريف — Laser-Engraved Quran Stand',
    vendor: 'IRTH إرث', productType: 'Accessories — إكسسوار', status: 'ACTIVE',
    tags:   ['quran-stand','quran','wood','gift','spirit-madinah'],
    descriptionHtml: '<p dir="rtl">حامل مصحف من خشب طبيعي منقوش بالليزر بزخارف إسلامية. هدية روحانية راقية.</p>',
    seo:    { title: 'حامل المصحف الشريف خشب منقوش | هدية إسلامية — إرث', description: 'حامل مصحف خشب طبيعي منقوش بالليزر. في صندوق هدايا فاخر.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'حامل المصحف الشريف' }],
    productOptions: [{ name: 'Style', values: [{ name: 'خشب طبيعي — نقش ذهبي' }] }],
    variants: [{ price: '1500.00', sku: 'IRTH-ACC-QRNS-NW', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['spirit-of-madinah','gift-boxes'],
  },
  {
    handle: 'masjid-nabawi-fragrance',
    title:  'عطر الحرم النبوي الشريف — Masjid Al-Nabawi Fragrance',
    vendor: 'IRTH إرث', productType: 'Fragrance — عطر', status: 'ACTIVE',
    tags:   ['fragrance','oud','haram','gift','spirit-madinah','launch'],
    descriptionHtml: '<p dir="rtl">عطر مستوحى من رائحة المسجد النبوي الشريف. كل رشة تأخذك للمدينة.</p>',
    seo:    { title: 'عطر الحرم النبوي الشريف | عطر مدينية أصيل — إرث', description: 'عطر مستوحى من رائحة المسجد النبوي. مزيج من العود والمسك والورد الطائفي.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'عطر الحرم النبوي الشريف' }],
    productOptions: [{ name: 'Size', values: [{ name: '50ml — عطر' }, { name: '100ml — عطر' }] }],
    variants: [
      { price: '680.00',  sku: 'IRTH-FRG-HRM-50',  inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '1100.00', sku: 'IRTH-FRG-HRM-100', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['spirit-of-madinah','gift-boxes','new-arrivals'],
  },
  {
    handle: 'haram-bakhoor-incense',
    title:  'بخور الحرم النبوي — Al-Haram Bakhoor',
    vendor: 'IRTH إرث', productType: 'Bakhoor — بخور', status: 'ACTIVE',
    tags:   ['bakhoor','incense','haram','madinah','gift','spirit-madinah','launch'],
    descriptionHtml: '<p dir="rtl">بخور مستوحى من عطر الحرم النبوي الشريف. طبيعي وأصيل.</p>',
    seo:    { title: 'بخور الحرم النبوي | بخور عربي أصيل — إرث', description: 'بخور مستوحى من عطر الحرم النبوي الشريف. يملأ بيتك بروح المدينة.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'بخور الحرم النبوي' }],
    productOptions: [{ name: 'Weight', values: [{ name: '30g' }] }],
    variants: [{ price: '320.00', sku: 'IRTH-BKH-HRM-30', inventoryPolicy: 'CONTINUE', taxable: true }],
    collections: ['spirit-of-madinah','new-arrivals'],
  },
  {
    handle: 'arabic-dallah-coffee-pot',
    title:  'دلة القهوة العربية — Arabic Dallah Coffee Pot',
    vendor: 'IRTH إرث', productType: 'Dallah — دلة', status: 'ACTIVE',
    tags:   ['dallah','coffee-pot','arabic-coffee','brass','gift','spirit-madinah','launch'],
    descriptionHtml: '<p dir="rtl">دلة قهوة عربية مصنوعة من النحاس الأصيل — رمز الكرم العربي وضيافة الحجاز.</p>',
    seo:    { title: 'دلة القهوة العربية النحاس | دلة مدينية فاخرة — إرث', description: 'دلة قهوة عربية من النحاس الأصيل. رمز الكرم العربي.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'دلة القهوة العربية' }],
    productOptions: [{ name: 'Material', values: [{ name: 'نحاس — 1 لتر' }, { name: 'نحاس مذهب — 1 لتر' }] }],
    variants: [
      { price: '1200.00', sku: 'IRTH-DLL-BRS-1L', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '1800.00', sku: 'IRTH-DLL-GLD-1L', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['spirit-of-madinah','gift-boxes','new-arrivals'],
  },
  {
    handle: 'extra-virgin-olive-oil-madinah',
    title:  'زيت زيتون بكر ممتاز — Extra Virgin Olive Oil',
    vendor: 'IRTH إرث', productType: 'Wellness — صحة', status: 'ACTIVE',
    tags:   ['olive-oil','wellness','prophetic','launch','spirit-madinah'],
    descriptionHtml: '<p dir="rtl">زيت زيتون بكر ممتاز — «كلوا الزيت وادهنوا به، فإنه من شجرة مباركة». في زجاجة فاخرة.</p>',
    seo:    { title: 'زيت الزيتون البكر الممتاز | زيت نبوي أصيل — إرث', description: 'زيت زيتون بكر ممتاز. طبيعي 100% في زجاجة فاخرة.' },
    metafields: [
      { namespace: 'irth', key: 'arabic_name',     type: 'single_line_text_field', value: 'زيت زيتون بكر ممتاز' },
      { namespace: 'irth', key: 'hadith_reference', type: 'single_line_text_field', value: 'كلوا الزيت وادهنوا به، فإنه من شجرة مباركة — حديث شريف' },
    ],
    productOptions: [{ name: 'Size', values: [{ name: '250ml — زجاجة فاخرة' }, { name: '500ml — زجاجة فاخرة' }] }],
    variants: [
      { price: '280.00', sku: 'IRTH-OIL-OLV-250', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '480.00', sku: 'IRTH-OIL-OLV-500', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['spirit-of-madinah','new-arrivals'],
  },
  {
    handle: 'arabic-coffee-premium-blend',
    title:  'القهوة العربية الفاخرة — Premium Arabic Coffee',
    vendor: 'IRTH إرث', productType: 'Arabic Coffee — قهوة عربية', status: 'ACTIVE',
    tags:   ['arabic-coffee','coffee','hospitality','dallah','spirit-madinah','launch'],
    descriptionHtml: '<p dir="rtl">قهوة عربية فاخرة محمصة ومطحونة على الطريقة الأصيلة — بهيل، زعفران، وهيل.</p>',
    seo:    { title: 'القهوة العربية الفاخرة | قهوة بهيل وزعفران — إرث', description: 'قهوة عربية فاخرة محمصة ومطحونة. رمز الضيافة الحجازية.' },
    metafields: [{ namespace: 'irth', key: 'arabic_name', type: 'single_line_text_field', value: 'القهوة العربية الفاخرة' }],
    productOptions: [{ name: 'Blend', values: [{ name: '200g — قهوة بهيل' }, { name: '200g — قهوة زعفران' }, { name: '200g — تشكيلة مشكلة' }] }],
    variants: [
      { price: '320.00', sku: 'IRTH-COF-ARB-200C', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '380.00', sku: 'IRTH-COF-ARB-200S', inventoryPolicy: 'CONTINUE', taxable: true },
      { price: '350.00', sku: 'IRTH-COF-ARB-200M', inventoryPolicy: 'CONTINUE', taxable: true },
    ],
    collections: ['spirit-of-madinah','new-arrivals'],
  },
];

/* ── Main execution ──────────────────────────────────────────────────── */
async function main() {
  console.log('🌿  IRTH Phase 1 — Shopify catalog creation');
  console.log(`    Store: ${STORE}\n`);

  /* Step 1: Create collections */
  console.log('── Step 1: Collections ──────────────────────');
  const collectionIds = {};
  for (const col of COLLECTIONS) {
    try {
      const data = await gql(CREATE_COLLECTION, {
        input: { title: col.title, handle: col.handle, seo: col.seo }
      });
      const { collection, userErrors } = data.collectionCreate;
      if (userErrors.length) {
        console.warn(`  ⚠️  ${col.handle}:`, userErrors.map(e => e.message).join(', '));
      } else {
        collectionIds[col.handle] = collection.id;
        console.log(`  ✅  ${col.handle} → ${collection.id}`);
      }
    } catch (err) {
      console.error(`  ❌  ${col.handle}:`, err.message);
    }
    await sleep(600);
  }

  /* Step 2: Create products + assign to collections */
  console.log('\n── Step 2: Products ─────────────────────────');
  let created = 0;
  for (const p of PRODUCTS) {
    try {
      const { title, handle, vendor, productType, status, tags,
              descriptionHtml, seo, metafields, productOptions, variants } = p;

      const data = await gql(CREATE_PRODUCT, {
        product: {
          title, handle, vendor, productType, status,
          tags, descriptionHtml, seo, metafields, productOptions,
          variants: variants.map((v, i) => ({
            ...v,
            // Attach option values to each variant
            optionValues: productOptions?.[0]?.values?.[i]
              ? [{ optionName: productOptions[0].name, name: productOptions[0].values[i].name }]
              : undefined,
          })),
        },
      });

      const { product, userErrors } = data.productCreate;
      if (userErrors.length) {
        console.warn(`  ⚠️  ${handle}:`, userErrors.map(e => e.message).join(', '));
        continue;
      }

      console.log(`  ✅  [${++created}/29] ${handle}`);

      /* Assign to collections */
      if (p.collections?.length) {
        for (const colHandle of p.collections) {
          const colId = collectionIds[colHandle];
          if (!colId) continue;
          await sleep(300);
          await gql(ADD_TO_COLLECTION, {
            id: colId,
            productIds: [product.id],
          });
        }
      }
    } catch (err) {
      console.error(`  ❌  ${p.handle}:`, err.message);
    }
    await sleep(700); // ~1 req/s total
  }

  console.log(`\n🎉  Done! ${created}/${PRODUCTS.length} products created.`);
  console.log('   Next: add images via Shopify Admin, then run Phase 5 (alt text).');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
