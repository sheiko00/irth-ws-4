#!/usr/bin/env node
/**
 * IRTH Phase 1 — Catalog creation via Shopify CLI (shopify store execute)
 * No API token needed — uses CLI auth via SHOPIFY_CLI_PARTNERS_TOKEN
 *
 * Prerequisites:
 *   1. Set SHOPIFY_CLI_PARTNERS_TOKEN=atkn_xxx (your Partner automation token)
 *   2. Run once: shopify store auth --store irthmadina.myshopify.com --scopes write_products,read_products
 *   3. node scripts/phase1-cli.mjs
 */

import { execSync }  from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join }     from 'path';

const STORE = process.env.SHOPIFY_STORE || 'irthmadina.myshopify.com';

/* ── CLI GraphQL helper ───────────────────────────────────────────── */
let _queryFile = join(tmpdir(), 'irth-mutation.graphql');
let _varFile   = join(tmpdir(), 'irth-vars.json');

function gql(query, variables = {}, isMutation = true) {
  writeFileSync(_queryFile, query, 'utf8');
  writeFileSync(_varFile,   JSON.stringify(variables), 'utf8');

  const mutFlag = isMutation ? '--allow-mutations' : '';
  const cmd = [
    'SHOPIFY_CLI_AGENT_INFO="n:irth-catalog|v:1.0|p:claude-code"',
    `shopify store execute`,
    `--store ${STORE}`,
    `--query-file "${_queryFile}"`,
    `--variables-file "${_varFile}"`,
    mutFlag,
  ].filter(Boolean).join(' ');

  try {
    const out = execSync(cmd, {
      env:      { ...process.env },
      encoding: 'utf8',
      stdio:    ['pipe','pipe','pipe'],
    });
    return JSON.parse(out);
  } catch (err) {
    const msg = err.stderr || err.stdout || err.message;
    throw new Error(`CLI error: ${msg}`);
  }
}

/* Cleanup temp files on exit */
process.on('exit', () => {
  try { unlinkSync(_queryFile); } catch {}
  try { unlinkSync(_varFile);   } catch {}
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── Mutations ────────────────────────────────────────────────────── */
const CREATE_COLLECTION = `
  mutation CreateCollection($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection { id handle title }
      userErrors  { field message }
    }
  }
`;

const CREATE_PRODUCT = `
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

const ADD_TO_COLLECTION = `
  mutation AddToCollection($id: ID!, $productIds: [ID!]!) {
    collectionAddProducts(id: $id, productIds: $productIds) {
      collection { id productsCount { count } }
      userErrors  { field message }
    }
  }
`;

/* ── Collections ──────────────────────────────────────────────────── */
const COLLECTIONS = [
  {
    handle: 'dates',
    title:  'التمر — Dates',
    seo: { title: 'تمور المدينة الفاخرة | مجول وعجوة — إرث', description: 'أجود تمور المدينة المنورة. إرث — من وحي المدينة.' },
  },
  {
    handle: 'madinah-herbs',
    title:  'أعشاب المدينة — Madinah Herbs',
    seo: { title: 'أعشاب المدينة المنورة الأصيلة | زعفران ونعناع — إرث', description: 'أعشاب طبيعية أصيلة من المدينة. إرث — من وحي المدينة.' },
  },
  {
    handle: 'spirit-of-madinah',
    title:  'روح المدينة — Spirit of Madinah',
    seo: { title: 'روح المدينة | سبح وسجاد وعطور — إرث', description: 'اقتني روح المدينة في بيتك. إرث — من وحي المدينة.' },
  },
  {
    handle: 'gift-boxes',
    title:  'صناديق الهدايا — Gift Boxes',
    seo: { title: 'صناديق هدايا فاخرة — إرث', description: 'صناديق هدايا فاخرة لكل مناسبة.' },
  },
  {
    handle: 'new-arrivals',
    title:  'تشكيلة الإطلاق — Launch Collection',
    seo: { title: 'تشكيلة الإطلاق — الجديد من إرث', description: 'أحدث منتجات إرث.' },
  },
];

/* ── Products ─────────────────────────────────────────────────────── */
const PRODUCTS = [
  /* DATES */
  { handle:'medjool-dates-premium', title:'تمر المجول الفاخر — Premium Medjool Dates',
    vendor:'IRTH إرث', productType:'Dates — تمور', status:'ACTIVE',
    tags:['dates','medjool','gift','premium','launch'],
    descriptionHtml:'<p dir="rtl">ملك التمور في صندوق خشب مُحفور بالليزر.</p>',
    seo:{ title:'تمر المجول الفاخر | صندوق خشب — إرث', description:'تمر مجول درجة أولى. توصيل 24–48 ساعة.' },
    metafields:[
      { namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'تمر المجول الفاخر' },
      { namespace:'irth', key:'origin',      type:'single_line_text_field', value:'المدينة المنورة — Saudi Arabia' },
      { namespace:'irth', key:'hadith_reference', type:'single_line_text_field', value:'ملك التمور — هدية راقية تعبّر عن أرقى معاني الكرم' },
    ],
    productOptions:[{ name:'Weight', values:[{name:'500g — صندوق خشب'},{name:'1kg — صندوق خشب'}] }],
    variants:[
      { price:'850.00',  sku:'IRTH-DATE-MJD-500W', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'500g — صندوق خشب'}] },
      { price:'1500.00', sku:'IRTH-DATE-MJD-1KW',  inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'1kg — صندوق خشب'}] },
    ],
    collections:['dates','gift-boxes','new-arrivals'] },

  { handle:'ajwa-madinah-dates', title:'تمر العجوة المدينية — Ajwa Al-Madinah Dates',
    vendor:'IRTH إرث', productType:'Dates — تمور', status:'ACTIVE',
    tags:['dates','ajwa','madinah','prophetic','gift','launch','ramadan'],
    descriptionHtml:'<p dir="rtl">تمر العجوة من مزارع المدينة المعتمدة.</p>',
    seo:{ title:'عجوة المدينة المنورة الأصيلة | تمر نبوي — إرث', description:'تمر العجوة من مزارع المدينة المعتمدة.' },
    metafields:[
      { namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'تمر العجوة المدينية' },
      { namespace:'irth', key:'origin',      type:'single_line_text_field', value:'مزارع المدينة المنورة' },
      { namespace:'irth', key:'hadith_reference', type:'single_line_text_field', value:'مَنْ تَصَبَّحَ بِسَبْعِ تَمَرَاتٍ عَجْوَةً لَمْ يَضُرَّهُ سُمٌّ وَلاَ سِحْرٌ — متفق عليه' },
    ],
    productOptions:[{ name:'Weight', values:[{name:'400g'},{name:'800g — علبة فاخرة'}] }],
    variants:[
      { price:'550.00', sku:'IRTH-DATE-AJW-400',  inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'400g'}] },
      { price:'980.00', sku:'IRTH-DATE-AJW-800L', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'800g — علبة فاخرة'}] },
    ],
    collections:['dates','gift-boxes','new-arrivals'] },

  { handle:'maftel-dates', title:'تمر المفتل الحجازي — Maftel Hijazi Dates',
    vendor:'IRTH إرث', productType:'Dates — تمور', status:'ACTIVE',
    tags:['dates','maftel','hijazi','traditional'],
    descriptionHtml:'<p dir="rtl">تمر مفتل حجازي أصيل.</p>',
    seo:{ title:'تمر المفتل الحجازي | تمر تقليدي — إرث', description:'تمر المفتل الحجازي التقليدي.' },
    metafields:[
      { namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'تمر المفتل الحجازي' },
      { namespace:'irth', key:'origin',      type:'single_line_text_field', value:'الحجاز — Al-Hijaz, Saudi Arabia' },
    ],
    productOptions:[{ name:'Weight', values:[{name:'400g'}] }],
    variants:[{ price:'420.00', sku:'IRTH-DATE-MFT-400', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'400g'}] }],
    collections:['dates','new-arrivals'] },

  { handle:'fresh-rutab-dates', title:'رطب المدينة الطازج — Fresh Madinah Rutab',
    vendor:'IRTH إرث', productType:'Dates — تمور', status:'ACTIVE',
    tags:['dates','rutab','fresh','madinah','seasonal'],
    descriptionHtml:'<p dir="rtl">رطب طازج من مزارع المدينة المنورة.</p>',
    seo:{ title:'رطب المدينة الطازج | رطب طازج — إرث', description:'رطب طازج من مزارع المدينة.' },
    metafields:[
      { namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'رطب المدينة الطازج' },
      { namespace:'irth', key:'origin',      type:'single_line_text_field', value:'مزارع المدينة المنورة' },
    ],
    productOptions:[{ name:'Weight', values:[{name:'300g'},{name:'500g'}] }],
    variants:[
      { price:'380.00', sku:'IRTH-DATE-RTB-300', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'300g'}] },
      { price:'590.00', sku:'IRTH-DATE-RTB-500', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'500g'}] },
    ],
    collections:['dates','new-arrivals'] },

  { handle:'stuffed-dates-premium', title:'تمور محشية فاخرة — Premium Stuffed Dates',
    vendor:'IRTH إرث', productType:'Dates — تمور', status:'ACTIVE',
    tags:['dates','stuffed','gift','luxury','premium','nuts'],
    descriptionHtml:'<p dir="rtl">تمور مجول محشية بأجود المكسرات.</p>',
    seo:{ title:'تمور محشية فاخرة | مجول محشي — إرث', description:'تمور مجول محشية بالمكسرات في تغليف فاخر.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'تمور محشية فاخرة' }],
    productOptions:[{ name:'Filling', values:[{name:'300g — محشي لوز'},{name:'300g — محشي جوز'},{name:'300g — محشي فستق'},{name:'300g — تشكيلة'}] }],
    variants:[
      { price:'750.00', sku:'IRTH-DATE-STF-ALM', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Filling',name:'300g — محشي لوز'}] },
      { price:'750.00', sku:'IRTH-DATE-STF-WLN', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Filling',name:'300g — محشي جوز'}] },
      { price:'790.00', sku:'IRTH-DATE-STF-PST', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Filling',name:'300g — محشي فستق'}] },
      { price:'800.00', sku:'IRTH-DATE-STF-MIX', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Filling',name:'300g — تشكيلة'}] },
    ],
    collections:['dates','gift-boxes'] },

  { handle:'coated-dates-chocolate', title:'تمور متغطية بالشوكولاتة — Chocolate Coated Dates',
    vendor:'IRTH إرث', productType:'Dates — تمور', status:'ACTIVE',
    tags:['dates','coated','chocolate','gift','luxury','ramadan'],
    descriptionHtml:'<p dir="rtl">تمور مجول متغطية بالشوكولاتة الفاخرة.</p>',
    seo:{ title:'تمور متغطية بالشوكولاتة | هدية مميزة — إرث', description:'تمور مجول متغطية بالشوكولاتة.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'تمور متغطية بالشوكولاتة' }],
    productOptions:[{ name:'Type', values:[{name:'200g — شوكولاتة داكنة'},{name:'200g — شوكولاتة بيضاء'},{name:'200g — مشكل'}] }],
    variants:[
      { price:'480.00', sku:'IRTH-DATE-COT-DRK', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Type',name:'200g — شوكولاتة داكنة'}] },
      { price:'480.00', sku:'IRTH-DATE-COT-WHT', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Type',name:'200g — شوكولاتة بيضاء'}] },
      { price:'490.00', sku:'IRTH-DATE-COT-MIX', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Type',name:'200g — مشكل'}] },
    ],
    collections:['dates','gift-boxes'] },

  /* HERBS */
  { handle:'madinah-mint-dried', title:'نعناع المدينة المنورة المجفف — Dried Madinah Mint',
    vendor:'IRTH إرث', productType:'Herbs — أعشاب', status:'ACTIVE',
    tags:['herbs','mint','madinah','wellness','launch'],
    descriptionHtml:'<p dir="rtl">نعناع مجفف من مزارع المدينة. طبيعي 100%.</p>',
    seo:{ title:'نعناع المدينة المجفف | أعشاب طبيعية — إرث', description:'نعناع مجفف طبيعي من المدينة المنورة.' },
    metafields:[
      { namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'نعناع المدينة المنورة' },
      { namespace:'irth', key:'origin',      type:'single_line_text_field', value:'مزارع المدينة المنورة' },
    ],
    productOptions:[{ name:'Weight', values:[{name:'50g'}] }],
    variants:[{ price:'250.00', sku:'IRTH-HERB-MNT-50', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'50g'}] }],
    collections:['madinah-herbs','new-arrivals'] },

  { handle:'madinah-basil-dried', title:'حبق المدينة المنورة المجفف — Dried Madinah Basil',
    vendor:'IRTH إرث', productType:'Herbs — أعشاب', status:'ACTIVE',
    tags:['herbs','basil','madinah','wellness','launch'],
    descriptionHtml:'<p dir="rtl">حبق مجفف من المدينة المنورة.</p>',
    seo:{ title:'حبق المدينة المنورة | أعشاب مجففة — إرث', description:'حبق مجفف طبيعي.' },
    metafields:[
      { namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'حبق المدينة المنورة' },
      { namespace:'irth', key:'origin',      type:'single_line_text_field', value:'المدينة المنورة' },
    ],
    productOptions:[{ name:'Weight', values:[{name:'40g'}] }],
    variants:[{ price:'260.00', sku:'IRTH-HERB-BSL-40', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'40g'}] }],
    collections:['madinah-herbs','new-arrivals'] },

  { handle:'taif-rose-dried-petals', title:'ورد الطائف المجفف — Dried Taif Rose Petals',
    vendor:'IRTH إرث', productType:'Herbs — أعشاب', status:'ACTIVE',
    tags:['herbs','rose','taif','wellness','fragrance','launch','gift'],
    descriptionHtml:'<p dir="rtl">ورد الطائف المجفف — أعطر وردة في الجزيرة العربية.</p>',
    seo:{ title:'ورد الطائف المجفف | وردة الإمبراطور — إرث', description:'ورد الطائف من مزارع الطائف.' },
    metafields:[
      { namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'ورد الطائف المجفف' },
      { namespace:'irth', key:'origin',      type:'single_line_text_field', value:'مزارع الطائف — Al-Taif, Saudi Arabia' },
    ],
    productOptions:[{ name:'Weight', values:[{name:'20g'}] }],
    variants:[{ price:'450.00', sku:'IRTH-HERB-RSE-20', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'20g'}] }],
    collections:['madinah-herbs','gift-boxes','new-arrivals'] },

  { handle:'premium-saffron-full-petal', title:'الزعفران الممتاز كامل الأوتار — Premium Saffron',
    vendor:'IRTH إرث', productType:'Herbs — أعشاب', status:'ACTIVE',
    tags:['herbs','saffron','premium','gift','luxury','launch'],
    descriptionHtml:'<p dir="rtl">زعفران Grade A من الدرجة الأولى.</p>',
    seo:{ title:'الزعفران الممتاز كامل الأوتار | زعفران أصيل — إرث', description:'زعفران Grade A في علبة فاخرة.' },
    metafields:[
      { namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'الزعفران الممتاز' },
      { namespace:'irth', key:'origin',      type:'single_line_text_field', value:'Grade A Premium' },
    ],
    productOptions:[{ name:'Weight', values:[{name:'1g — علبة فاخرة'},{name:'3g — علبة فاخرة'}] }],
    variants:[
      { price:'580.00',  sku:'IRTH-HERB-SFR-1G', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'1g — علبة فاخرة'}] },
      { price:'1550.00', sku:'IRTH-HERB-SFR-3G', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'3g — علبة فاخرة'}] },
    ],
    collections:['madinah-herbs','gift-boxes','new-arrivals'] },

  { handle:'sidr-lote-powder-premium', title:'مسحوق السدر الممتاز — Premium Sidr Powder',
    vendor:'IRTH إرث', productType:'Herbs — أعشاب', status:'ACTIVE',
    tags:['herbs','sidr','wellness','prophetic','launch'],
    descriptionHtml:'<p dir="rtl">مسحوق السدر الممتاز — مطحون سبع مرات.</p>',
    seo:{ title:'مسحوق السدر النبوي | طحن سبع مرات — إرث', description:'مسحوق السدر الممتاز للغسيل والعناية.' },
    metafields:[
      { namespace:'irth', key:'arabic_name',      type:'single_line_text_field', value:'مسحوق السدر الممتاز' },
      { namespace:'irth', key:'origin',           type:'single_line_text_field', value:'الجزيرة العربية — Saudi Arabia' },
      { namespace:'irth', key:'hadith_reference', type:'single_line_text_field', value:'وَسِدْرٍ مَّخْضُودٍ — القرآن الكريم (سورة الواقعة: ٢٨)' },
    ],
    productOptions:[{ name:'Weight', values:[{name:'200g'}] }],
    variants:[{ price:'380.00', sku:'IRTH-HERB-SDR-200S', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'200g'}] }],
    collections:['madinah-herbs','new-arrivals'] },

  /* MISBAHAS */
  { handle:'misbaha-ard-al-haram', title:'سبحة أرض الحرم — Ard Al-Haram Misbaha',
    vendor:'IRTH إرث', productType:'Misbaha — سبحة', status:'ACTIVE',
    tags:['misbaha','prayer-beads','haram','gift','spirit-madinah','launch'],
    descriptionHtml:'<p dir="rtl">سبحة مستوحاة من أرض الحرم المكي. خيط حرير، صندوق مخمل.</p>',
    seo:{ title:'سبحة أرض الحرم الفاخرة | سبح إسلامية — إرث', description:'سبحة مستوحاة من أرض الحرم المكي.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'سبحة أرض الحرم' }],
    productOptions:[{ name:'Beads', values:[{name:'33 حبة'},{name:'99 حبة'}] }],
    variants:[
      { price:'850.00',  sku:'IRTH-MSB-HRAM-33', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Beads',name:'33 حبة'}] },
      { price:'1200.00', sku:'IRTH-MSB-HRAM-99', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Beads',name:'99 حبة'}] },
    ],
    collections:['spirit-of-madinah','gift-boxes','new-arrivals'] },

  { handle:'misbaha-al-hajar-al-aswad', title:'سبحة الحجر الأسود — Al-Hajar Al-Aswad Misbaha',
    vendor:'IRTH إرث', productType:'Misbaha — سبحة', status:'ACTIVE',
    tags:['misbaha','black-stone','gift','spirit-madinah','launch'],
    descriptionHtml:'<p dir="rtl">سبحة مستوحاة من الحجر الأسود. في علبة جلد فاخرة.</p>',
    seo:{ title:'سبحة الحجر الأسود | سبحة فاخرة — إرث', description:'سبحة الحجر الأسود في علبة جلد.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'سبحة الحجر الأسود' }],
    productOptions:[{ name:'Beads', values:[{name:'33 حبة'}] }],
    variants:[{ price:'950.00', sku:'IRTH-MSB-HJRS-33', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Beads',name:'33 حبة'}] }],
    collections:['spirit-of-madinah','gift-boxes'] },

  { handle:'misbaha-qandeel-al-kaaba', title:'سبحة قنديل الكعبة — Qandeel Al-Kaaba Misbaha',
    vendor:'IRTH إرث', productType:'Misbaha — سبحة', status:'ACTIVE',
    tags:['misbaha','kaaba','gold','luxury','gift','spirit-madinah'],
    descriptionHtml:'<p dir="rtl">سبحة ذهبية مستوحاة من قناديل الكعبة.</p>',
    seo:{ title:'سبحة قنديل الكعبة الذهبية — إرث', description:'سبحة بتصميم ذهبي مستوحى من الكعبة.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'سبحة قنديل الكعبة' }],
    productOptions:[{ name:'Beads', values:[{name:'33 حبة'}] }],
    variants:[{ price:'1100.00', sku:'IRTH-MSB-QNDL-33', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Beads',name:'33 حبة'}] }],
    collections:['spirit-of-madinah','gift-boxes'] },

  { handle:'misbaha-jabal-uhud', title:'سبحة جبل أحد — Jabal Uhud Misbaha',
    vendor:'IRTH إرث', productType:'Misbaha — سبحة', status:'ACTIVE',
    tags:['misbaha','uhud','madinah','gift','spirit-madinah'],
    descriptionHtml:'<p dir="rtl">سبحة مستوحاة من جبل أحد.</p>',
    seo:{ title:'سبحة جبل أحد | سبحة إسلامية فاخرة — إرث', description:'سبحة مستوحاة من جبل أحد.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'سبحة جبل أحد' }],
    productOptions:[{ name:'Beads', values:[{name:'33 حبة'}] }],
    variants:[{ price:'780.00', sku:'IRTH-MSB-UHUD-33', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Beads',name:'33 حبة'}] }],
    collections:['spirit-of-madinah','gift-boxes'] },

  { handle:'misbaha-shadharwan-al-kaaba', title:'سبحة شذروان الكعبة — Shadharwan Misbaha',
    vendor:'IRTH إرث', productType:'Misbaha — سبحة', status:'ACTIVE',
    tags:['misbaha','kaaba','luxury','gift','spirit-madinah'],
    descriptionHtml:'<p dir="rtl">سبحة شذروان الكعبة في صندوق جلد منقوش.</p>',
    seo:{ title:'سبحة شذروان الكعبة — إرث', description:'سبحة مستوحاة من شذروان الكعبة.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'سبحة شذروان الكعبة' }],
    productOptions:[{ name:'Beads', values:[{name:'33 حبة'}] }],
    variants:[{ price:'1050.00', sku:'IRTH-MSB-SHDW-33', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Beads',name:'33 حبة'}] }],
    collections:['spirit-of-madinah','gift-boxes'] },

  { handle:'misbaha-bab-al-salam', title:'سبحة باب السلام — Bab Al-Salam Misbaha',
    vendor:'IRTH إرث', productType:'Misbaha — سبحة', status:'ACTIVE',
    tags:['misbaha','bab-al-salam','madinah','gift','spirit-madinah'],
    descriptionHtml:'<p dir="rtl">سبحة باب السلام من المسجد النبوي.</p>',
    seo:{ title:'سبحة باب السلام | سبحة مدينية — إرث', description:'سبحة مستوحاة من باب السلام.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'سبحة باب السلام' }],
    productOptions:[{ name:'Beads', values:[{name:'33 حبة'}] }],
    variants:[{ price:'820.00', sku:'IRTH-MSB-SLAM-33', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Beads',name:'33 حبة'}] }],
    collections:['spirit-of-madinah','gift-boxes'] },

  { handle:'misbaha-bab-al-aqeeq', title:'سبحة باب العقيق — Bab Al-Aqeeq Misbaha',
    vendor:'IRTH إرث', productType:'Misbaha — سبحة', status:'ACTIVE',
    tags:['misbaha','aqeeq','yemeni','carnelian','luxury','gift','spirit-madinah','launch'],
    descriptionHtml:'<p dir="rtl">سبحة العقيق اليماني الأصيل — مستوحاة من باب العقيق.</p>',
    seo:{ title:'سبحة العقيق اليماني | باب العقيق — إرث', description:'سبحة العقيق اليماني + خيط حرير + صندوق جلد.' },
    metafields:[
      { namespace:'irth', key:'arabic_name',      type:'single_line_text_field', value:'سبحة باب العقيق — عقيق يماني' },
      { namespace:'irth', key:'hadith_reference',  type:'single_line_text_field', value:'عليكم بالعقيق فإنه ينفي الفقر — أثر نبوي' },
    ],
    productOptions:[{ name:'Stone', values:[{name:'33 حبة عقيق يماني'},{name:'33 حبة عقيق طبيعي'}] }],
    variants:[
      { price:'1800.00', sku:'IRTH-MSB-AQIQ-33Y', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Stone',name:'33 حبة عقيق يماني'}] },
      { price:'980.00',  sku:'IRTH-MSB-AQIQ-33N', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Stone',name:'33 حبة عقيق طبيعي'}] },
    ],
    collections:['spirit-of-madinah','gift-boxes','new-arrivals'] },

  /* PRAYER RUGS */
  { handle:'prayer-rug-rawdah-boundaries', title:'سجادة صلاة حدود الروضة — Al-Rawdah Prayer Rug',
    vendor:'IRTH إرث', productType:'Prayer Rug — سجادة صلاة', status:'ACTIVE',
    tags:['prayer-rug','rawdah','madinah','gift','spirit-madinah','launch'],
    descriptionHtml:'<p dir="rtl">سجادة الروضة الشريفة — ما بين بيتي ومنبري روضة من رياض الجنة.</p>',
    seo:{ title:'سجادة صلاة الروضة الشريفة | سجاد مدينية — إرث', description:'سجادة بتصميم الروضة الشريفة.' },
    metafields:[
      { namespace:'irth', key:'arabic_name',      type:'single_line_text_field', value:'سجادة صلاة حدود الروضة الشريفة' },
      { namespace:'irth', key:'hadith_reference',  type:'single_line_text_field', value:'ما بين بيتي ومنبري روضة من رياض الجنة — متفق عليه' },
    ],
    productOptions:[{ name:'Material', values:[{name:'مخمل تركي'},{name:'حرير طبيعي'}] }],
    variants:[
      { price:'950.00',  sku:'IRTH-RUG-RWDH-VLV', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Material',name:'مخمل تركي'}] },
      { price:'1800.00', sku:'IRTH-RUG-RWDH-SLK', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Material',name:'حرير طبيعي'}] },
    ],
    collections:['spirit-of-madinah','gift-boxes','new-arrivals'] },

  { handle:'prayer-rug-quba-mosque', title:'سجادة صلاة مسجد قباء — Quba Prayer Rug',
    vendor:'IRTH إرث', productType:'Prayer Rug — سجادة صلاة', status:'ACTIVE',
    tags:['prayer-rug','quba','madinah','gift','spirit-madinah'],
    descriptionHtml:'<p dir="rtl">سجادة صلاة مسجد قباء — أول مسجد في الإسلام.</p>',
    seo:{ title:'سجادة صلاة مسجد قباء — إرث', description:'سجادة بتصميم مسجد قباء.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'سجادة صلاة مسجد قباء' }],
    productOptions:[{ name:'Material', values:[{name:'مخمل تركي'}] }],
    variants:[{ price:'850.00', sku:'IRTH-RUG-QUBA-VLV', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Material',name:'مخمل تركي'}] }],
    collections:['spirit-of-madinah','gift-boxes'] },

  { handle:'prayer-rug-dhul-qiblatayn', title:'سجادة صلاة ذو القبلتين — Dhul Qiblatayn Prayer Rug',
    vendor:'IRTH إرث', productType:'Prayer Rug — سجادة صلاة', status:'ACTIVE',
    tags:['prayer-rug','dhul-qiblatayn','madinah','gift','spirit-madinah'],
    descriptionHtml:'<p dir="rtl">سجادة مسجد ذو القبلتين — تاريخ إسلامي عريق.</p>',
    seo:{ title:'سجادة صلاة ذو القبلتين — إرث', description:'سجادة بتصميم مسجد ذو القبلتين.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'سجادة صلاة ذو القبلتين' }],
    productOptions:[{ name:'Material', values:[{name:'مخمل تركي'}] }],
    variants:[{ price:'880.00', sku:'IRTH-RUG-DQLB-VLV', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Material',name:'مخمل تركي'}] }],
    collections:['spirit-of-madinah','gift-boxes'] },

  /* REMAINING SPIRIT */
  { handle:'laser-engraved-quran-stand', title:'حامل المصحف الشريف — Quran Stand',
    vendor:'IRTH إرث', productType:'Accessories — إكسسوار', status:'ACTIVE',
    tags:['quran-stand','gift','spirit-madinah'],
    descriptionHtml:'<p dir="rtl">حامل مصحف خشب طبيعي منقوش بالليزر.</p>',
    seo:{ title:'حامل المصحف الشريف منقوش | هدية إسلامية — إرث', description:'حامل مصحف خشب منقوش في صندوق هدايا.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'حامل المصحف الشريف' }],
    productOptions:[{ name:'Style', values:[{name:'خشب طبيعي — نقش ذهبي'}] }],
    variants:[{ price:'1500.00', sku:'IRTH-ACC-QRNS-NW', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Style',name:'خشب طبيعي — نقش ذهبي'}] }],
    collections:['spirit-of-madinah','gift-boxes'] },

  { handle:'masjid-nabawi-fragrance', title:'عطر الحرم النبوي الشريف — Masjid Fragrance',
    vendor:'IRTH إرث', productType:'Fragrance — عطر', status:'ACTIVE',
    tags:['fragrance','oud','haram','gift','spirit-madinah','launch'],
    descriptionHtml:'<p dir="rtl">عطر مستوحى من رائحة المسجد النبوي الشريف.</p>',
    seo:{ title:'عطر الحرم النبوي الشريف — إرث', description:'عطر مستوحى من المسجد النبوي.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'عطر الحرم النبوي الشريف' }],
    productOptions:[{ name:'Size', values:[{name:'50ml'},{name:'100ml'}] }],
    variants:[
      { price:'680.00',  sku:'IRTH-FRG-HRM-50',  inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Size',name:'50ml'}] },
      { price:'1100.00', sku:'IRTH-FRG-HRM-100', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Size',name:'100ml'}] },
    ],
    collections:['spirit-of-madinah','gift-boxes','new-arrivals'] },

  { handle:'haram-bakhoor-incense', title:'بخور الحرم النبوي — Al-Haram Bakhoor',
    vendor:'IRTH إرث', productType:'Bakhoor — بخور', status:'ACTIVE',
    tags:['bakhoor','incense','haram','madinah','gift','spirit-madinah','launch'],
    descriptionHtml:'<p dir="rtl">بخور الحرم النبوي — طبيعي وأصيل.</p>',
    seo:{ title:'بخور الحرم النبوي | بخور عربي — إرث', description:'بخور مستوحى من عطر الحرم النبوي.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'بخور الحرم النبوي' }],
    productOptions:[{ name:'Weight', values:[{name:'30g'}] }],
    variants:[{ price:'320.00', sku:'IRTH-BKH-HRM-30', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Weight',name:'30g'}] }],
    collections:['spirit-of-madinah','new-arrivals'] },

  { handle:'arabic-dallah-coffee-pot', title:'دلة القهوة العربية — Arabic Dallah',
    vendor:'IRTH إرث', productType:'Dallah — دلة', status:'ACTIVE',
    tags:['dallah','coffee-pot','arabic-coffee','brass','gift','spirit-madinah','launch'],
    descriptionHtml:'<p dir="rtl">دلة قهوة عربية نحاسية — رمز الكرم العربي.</p>',
    seo:{ title:'دلة القهوة العربية النحاس — إرث', description:'دلة قهوة عربية من النحاس الأصيل.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'دلة القهوة العربية' }],
    productOptions:[{ name:'Material', values:[{name:'نحاس — 1 لتر'},{name:'نحاس مذهب — 1 لتر'}] }],
    variants:[
      { price:'1200.00', sku:'IRTH-DLL-BRS-1L', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Material',name:'نحاس — 1 لتر'}] },
      { price:'1800.00', sku:'IRTH-DLL-GLD-1L', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Material',name:'نحاس مذهب — 1 لتر'}] },
    ],
    collections:['spirit-of-madinah','gift-boxes','new-arrivals'] },

  { handle:'extra-virgin-olive-oil-madinah', title:'زيت زيتون بكر ممتاز — Extra Virgin Olive Oil',
    vendor:'IRTH إرث', productType:'Wellness — صحة', status:'ACTIVE',
    tags:['olive-oil','wellness','prophetic','launch','spirit-madinah'],
    descriptionHtml:'<p dir="rtl">زيت زيتون بكر ممتاز في زجاجة فاخرة.</p>',
    seo:{ title:'زيت الزيتون البكر الممتاز | زيت نبوي — إرث', description:'زيت زيتون بكر ممتاز. طبيعي 100%.' },
    metafields:[
      { namespace:'irth', key:'arabic_name',      type:'single_line_text_field', value:'زيت زيتون بكر ممتاز' },
      { namespace:'irth', key:'hadith_reference',  type:'single_line_text_field', value:'كلوا الزيت وادهنوا به، فإنه من شجرة مباركة — حديث شريف' },
    ],
    productOptions:[{ name:'Size', values:[{name:'250ml'},{name:'500ml'}] }],
    variants:[
      { price:'280.00', sku:'IRTH-OIL-OLV-250', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Size',name:'250ml'}] },
      { price:'480.00', sku:'IRTH-OIL-OLV-500', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Size',name:'500ml'}] },
    ],
    collections:['spirit-of-madinah','new-arrivals'] },

  { handle:'arabic-coffee-premium-blend', title:'القهوة العربية الفاخرة — Premium Arabic Coffee',
    vendor:'IRTH إرث', productType:'Arabic Coffee — قهوة عربية', status:'ACTIVE',
    tags:['arabic-coffee','coffee','hospitality','spirit-madinah','launch'],
    descriptionHtml:'<p dir="rtl">قهوة عربية فاخرة محمصة على الطريقة الأصيلة.</p>',
    seo:{ title:'القهوة العربية الفاخرة | بهيل وزعفران — إرث', description:'قهوة عربية فاخرة محمصة.' },
    metafields:[{ namespace:'irth', key:'arabic_name', type:'single_line_text_field', value:'القهوة العربية الفاخرة' }],
    productOptions:[{ name:'Blend', values:[{name:'200g — بهيل'},{name:'200g — زعفران'},{name:'200g — تشكيلة'}] }],
    variants:[
      { price:'320.00', sku:'IRTH-COF-ARB-200C', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Blend',name:'200g — بهيل'}] },
      { price:'380.00', sku:'IRTH-COF-ARB-200S', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Blend',name:'200g — زعفران'}] },
      { price:'350.00', sku:'IRTH-COF-ARB-200M', inventoryPolicy:'CONTINUE', taxable:true, optionValues:[{optionName:'Blend',name:'200g — تشكيلة'}] },
    ],
    collections:['spirit-of-madinah','new-arrivals'] },
];

/* ── Main ─────────────────────────────────────────────────────────── */
async function main() {
  console.log(`🌿  IRTH Phase 1 — via Shopify CLI (${STORE})\n`);

  // Collections
  console.log('── Collections ──────────────────────────────');
  const colIds = {};
  for (const c of COLLECTIONS) {
    try {
      const data = await gql(CREATE_COLLECTION, { input: { title: c.title, handle: c.handle, seo: c.seo } });
      const { collection, userErrors } = data.collectionCreate;
      if (userErrors.length) {
        console.warn(`  ⚠️  ${c.handle}:`, userErrors.map(e=>e.message).join(', '));
      } else {
        colIds[c.handle] = collection.id;
        console.log(`  ✅  ${c.handle}`);
      }
    } catch (e) { console.error(`  ❌  ${c.handle}:`, e.message); }
    await sleep(800);
  }

  // Products
  console.log('\n── Products ─────────────────────────────────');
  let n = 0;
  for (const p of PRODUCTS) {
    const { collections: cols, ...product } = p;
    try {
      const data = await gql(CREATE_PRODUCT, { product });
      const { product: created, userErrors } = data.productCreate;
      if (userErrors.length) {
        console.warn(`  ⚠️  ${p.handle}:`, userErrors.map(e=>e.message).join(', '));
        continue;
      }
      console.log(`  ✅  [${++n}/${PRODUCTS.length}] ${p.handle}`);

      for (const col of (cols || [])) {
        if (!colIds[col]) continue;
        await sleep(400);
        await gql(ADD_TO_COLLECTION, { id: colIds[col], productIds: [created.id] });
      }
    } catch (e) { console.error(`  ❌  ${p.handle}:`, e.message); }
    await sleep(900);
  }

  console.log(`\n🎉  Done — ${n}/${PRODUCTS.length} products created.`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
