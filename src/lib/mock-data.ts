import type { AnalysisResult, Locale } from "./types";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seeded(hash: number, min: number, max: number, salt: number): number {
  const x = Math.sin(hash * 12.9898 + salt * 78.233) * 43758.5453;
  const n = x - Math.floor(x);
  return min + n * (max - min);
}

const MONTHS_HE = [
  "ינו",
  "פבר",
  "מרץ",
  "אפר",
  "מאי",
  "יונ",
  "יול",
  "אוג",
  "ספט",
  "אוק",
  "נוב",
  "דצמ",
];

const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function splitName(query: string): { productName: string; brand: string } {
  const trimmed = query.trim() || "Dyson V15 Detect";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { productName: trimmed, brand: trimmed };
  return { productName: trimmed, brand: parts[0] };
}

type ProductImageRule = {
  test: RegExp;
  url: string;
};

const PRODUCT_IMAGE_RULES: ProductImageRule[] = [
  {
    test: /dyson|v15|vacuum|cleaner|שואב|דייסון/i,
    url: "https://images.unsplash.com/photo-1558317374-5701404c1c50?auto=format&fit=crop&w=800&h=450&q=80",
  },
  {
    test: /airpods|earbud|earphone|headphone|אוזניות/i,
    url: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&h=450&q=80",
  },
  {
    test: /hammock|ערסל|outdoor|camping/i,
    url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&h=450&q=80",
  },
  {
    test: /iphone|smartphone|galaxy|pixel/i,
    url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&h=450&q=80",
  },
  {
    test: /macbook|laptop|notebook/i,
    url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&h=450&q=80",
  },
  {
    test: /coffee|nespresso|espresso/i,
    url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&h=450&q=80",
  },
];

export function getProductImage(productName: string): string {
  const query = productName.trim() || "Dyson V15 Detect";
  const match = PRODUCT_IMAGE_RULES.find((rule) => rule.test.test(query));
  if (match) {
    return match.url;
  }

  const seed = query
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05ff]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "product";

  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/450`;
}

export type AnalysisOverrides = {
  hsCode?: string;
  estimatedFobUsd?: number;
  estimatedRetailIls?: number;
  customsRatePercent?: number;
  origin?: string;
  category?: string;
};

export type ProductCategoryKind = "electronics" | "outdoor" | "general";

export function resolveCategoryKind(
  productName: string,
  category = "",
): ProductCategoryKind {
  const q = `${productName} ${category}`.toLowerCase();
  if (
    /hammock|ערסל|tent|אוהל|camping|outdoor|textile|fabric|apparel|ציוד חוץ|טיולים|lametayel/.test(
      q,
    )
  ) {
    return "outdoor";
  }
  if (
    /dyson|vacuum|airpods|iphone|laptop|earbuds|electronics|שואב|אוזניות|אלקטרו|מחשב/.test(
      q,
    )
  ) {
    return "electronics";
  }
  return "general";
}

function productSearchUrls(query: string) {
  const q = encodeURIComponent(query);
  return {
    ksp: `https://www.ksp.co.il/web/cat/0/?search=${q}`,
    ivory: `https://www.ivory.co.il/catalog.php?act=cat&q=${q}`,
    amazon: `https://www.amazon.com/s?k=${q}`,
    amazonIl: `https://www.amazon.co.il/s?k=${q}`,
    alibaba: `https://www.alibaba.com/trade/search?SearchText=${q}`,
    decathlon: `https://www.decathlon.co.il/search?q=${q}`,
    lametayel: `https://www.lametayel.co.il/search?q=${q}`,
    shufersal: `https://www.shufersal.co.il/online/he/search?text=${q}`,
    mahsanei: `https://www.mhashmal.co.il/search?q=${q}`,
  };
}

export function buildAnalysis(
  query: string,
  locale: Locale,
  overrides: AnalysisOverrides = {},
): AnalysisResult {
  const q = query.trim() || "Dyson V15 Detect";
  const h = hashString(q.toLowerCase());
  const { productName, brand } = splitName(q);
  const kind = resolveCategoryKind(productName, overrides.category);
  const links = productSearchUrls(productName);
  const months = locale === "he" ? MONTHS_HE : MONTHS_EN;
  const start = new Date(2023, 8, 1);

  const importTrend = Array.from({ length: 36 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const seasonal = 1 + 0.22 * Math.sin((i / 12) * Math.PI * 2);
    const trend = 1 + i * 0.012;
    const noise = seeded(h, 0.82, 1.18, i + 3);
    const units = Math.round(4200 * seasonal * trend * noise);
    return {
      month: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      units,
    };
  });

  const totalUnitsImported = importTrend.reduce((sum, row) => sum + row.units, 0);
  const prior = importTrend.slice(0, 18).reduce((sum, row) => sum + row.units, 0);
  const recent = importTrend.slice(18).reduce((sum, row) => sum + row.units, 0);
  const unitsDeltaPercent = prior === 0 ? 0 : ((recent - prior) / prior) * 100;

  const fobRange =
    kind === "outdoor" ? ([9, 38] as const) : kind === "electronics" ? ([48, 320] as const) : ([18, 120] as const);
  const estimatedFobUsd =
    overrides.estimatedFobUsd && overrides.estimatedFobUsd > 0
      ? Math.round(overrides.estimatedFobUsd)
      : Math.round(seeded(h, fobRange[0], fobRange[1], 11));
  const freightUsd = Math.round(
    seeded(h, kind === "outdoor" ? 3 : 6, kind === "outdoor" ? 14 : 28, 12),
  );
  const dutyRange =
    kind === "outdoor" ? ([6, 12] as const) : kind === "electronics" ? ([0, 12] as const) : ([4, 12] as const);
  const customsRatePercent =
    overrides.customsRatePercent && overrides.customsRatePercent > 0
      ? Number(overrides.customsRatePercent.toFixed(1))
      : Number(seeded(h, dutyRange[0], dutyRange[1], 13).toFixed(1));
  const localFeesIls = Math.round(seeded(h, 18, 75, 14));
  const usdIls = 3.7;
  const cifIls = (estimatedFobUsd + freightUsd) * usdIls;
  const customsIls = cifIls * (customsRatePercent / 100);
  const vatRatePercent = 18;
  const vatIls = (cifIls + customsIls + localFeesIls) * (vatRatePercent / 100);
  const landed = cifIls + customsIls + localFeesIls + vatIls;
  const retailMultiplier =
    kind === "outdoor" ? seeded(h, 1.8, 3.4, 15) : seeded(h, 1.35, 1.95, 15);
  const targetRetailIls =
    overrides.estimatedRetailIls && overrides.estimatedRetailIls > 0
      ? Math.round(overrides.estimatedRetailIls)
      : Math.round(landed * retailMultiplier);
  const estimatedRoiPercent = ((targetRetailIls - landed) / landed) * 100;
  const activeImportersCount = Math.round(seeded(h, 7, 34, 21));

  const defaultHs =
    kind === "outdoor"
      ? "630690"
      : kind === "electronics"
        ? `85${String(h).slice(0, 6).padStart(6, "0")}`
        : `94${String(h).slice(0, 6).padStart(6, "0")}`;

  const localStores =
    kind === "outdoor"
      ? [
          {
            id: "r1",
            name: "Decathlon",
            city: locale === "he" ? "ראשון לציון" : "Rishon LeZion",
            priceIls: targetRetailIls,
            stock: "in_stock" as const,
            channel: locale === "he" ? "רשת חוץ" : "Outdoor chain",
            url: links.decathlon,
          },
          {
            id: "r2",
            name: locale === "he" ? "למטייל" : "Lametayel",
            city: locale === "he" ? "תל אביב" : "Tel Aviv",
            priceIls: Math.round(targetRetailIls * 1.06),
            stock: "low" as const,
            channel: locale === "he" ? "טיולים" : "Travel retail",
            url: links.lametayel,
          },
          {
            id: "r3",
            name: "Amazon.co.il",
            city: locale === "he" ? "משלוח ארצי" : "Nationwide",
            priceIls: Math.round(targetRetailIls * 0.95),
            stock: "in_stock" as const,
            channel: locale === "he" ? "אונליין" : "Online",
            url: links.amazonIl,
          },
          {
            id: "r4",
            name: "KSP",
            city: locale === "he" ? "פתח תקווה" : "Petah Tikva",
            priceIls: Math.round(targetRetailIls * 1.12),
            stock: "out" as const,
            channel: locale === "he" ? "רשת" : "Chain",
            url: links.ksp,
          },
          {
            id: "r5",
            name: "Amazon.com",
            city: locale === "he" ? "יבוא אישי" : "Personal import",
            priceIls: Math.round(targetRetailIls * 0.88),
            stock: "in_stock" as const,
            channel: locale === "he" ? "אונליין" : "Online",
            url: links.amazon,
          },
        ]
      : [
          {
            id: "r1",
            name: "KSP",
            city: locale === "he" ? "פתח תקווה" : "Petah Tikva",
            priceIls: targetRetailIls,
            stock: "in_stock" as const,
            channel: locale === "he" ? "רשת" : "Chain",
            url: links.ksp,
          },
          {
            id: "r2",
            name: locale === "he" ? "אייבורי" : "Ivory",
            city: locale === "he" ? "ראשון לציון" : "Rishon LeZion",
            priceIls: Math.round(targetRetailIls * 1.04),
            stock: "low" as const,
            channel: locale === "he" ? "רשת" : "Chain",
            url: links.ivory,
          },
          {
            id: "r3",
            name: "Amazon.co.il",
            city: locale === "he" ? "משלוח ארצי" : "Nationwide",
            priceIls: Math.round(targetRetailIls * 0.97),
            stock: "in_stock" as const,
            channel: locale === "he" ? "אונליין" : "Online",
            url: links.amazonIl,
          },
          {
            id: "r4",
            name: locale === "he" ? "שופרסל" : "Shufersal",
            city: locale === "he" ? "תל אביב" : "Tel Aviv",
            priceIls: Math.round(targetRetailIls * 1.08),
            stock: "out" as const,
            channel: locale === "he" ? "סופר" : "Grocery",
            url: links.shufersal,
          },
          {
            id: "r5",
            name: locale === "he" ? "מחסני חשמל" : "Mahsanei Hashmal",
            city: locale === "he" ? "חיפה" : "Haifa",
            priceIls: Math.round(targetRetailIls * 1.02),
            stock: "in_stock" as const,
            channel: locale === "he" ? "רשת" : "Chain",
            url: links.mahsanei,
          },
        ];

  const suppliers =
    kind === "outdoor"
      ? [
          {
            id: "s1",
            name: "Ningbo CampTex Outdoor Co.",
            country: locale === "he" ? "סין" : "China",
            fobUsd: estimatedFobUsd,
            moq: Math.round(seeded(h, 200, 800, 31) / 50) * 50,
            leadDays: Math.round(seeded(h, 18, 40, 32)),
            email: "export@camptex-nb.com",
            verified: true,
            url: links.alibaba,
          },
          {
            id: "s2",
            name: "Hangzhou Trail Weave Ltd.",
            country: locale === "he" ? "סין" : "China",
            fobUsd: Math.round(estimatedFobUsd * 0.9),
            moq: Math.round(seeded(h, 300, 1200, 33) / 50) * 50,
            leadDays: Math.round(seeded(h, 22, 45, 34)),
            email: "sales@trailweave.cn",
            verified: true,
            url: `${links.alibaba}&indexArea=product_en`,
          },
          {
            id: "s3",
            name: "Portable Comfort Factory",
            country: locale === "he" ? "וייטנאם" : "Vietnam",
            fobUsd: Math.round(estimatedFobUsd * 1.05),
            moq: Math.round(seeded(h, 100, 500, 35) / 25) * 25,
            leadDays: Math.round(seeded(h, 16, 35, 36)),
            email: "trade@portable-comfort.vn",
            verified: true,
            url: links.alibaba,
          },
        ]
      : [
          {
            id: "s1",
            name: "Shenzhen Apex OEM Ltd.",
            country: locale === "he" ? "סין" : "China",
            fobUsd: estimatedFobUsd,
            moq: Math.round(seeded(h, 200, 1000, 31) / 50) * 50,
            leadDays: Math.round(seeded(h, 18, 45, 32)),
            email: "sales@apex-oem.cn",
            verified: true,
            url: links.alibaba,
          },
          {
            id: "s2",
            name: "Ningbo Harbor Components",
            country: locale === "he" ? "סין" : "China",
            fobUsd: Math.round(estimatedFobUsd * 0.92),
            moq: Math.round(seeded(h, 500, 2000, 33) / 100) * 100,
            leadDays: Math.round(seeded(h, 25, 55, 34)),
            email: "export@nhc-global.com",
            verified: true,
            url: links.alibaba,
          },
          {
            id: "s3",
            name: "GDK Electronics GmbH",
            country: locale === "he" ? "גרמניה" : "Germany",
            fobUsd: Math.round(estimatedFobUsd * 1.18),
            moq: Math.round(seeded(h, 50, 300, 35) / 10) * 10,
            leadDays: Math.round(seeded(h, 12, 28, 36)),
            email: "trade@gdk-electronics.de",
            verified: true,
            url: links.amazon,
          },
        ];

  const freightSpecialty =
    kind === "outdoor"
      ? locale === "he"
        ? "טקסטיל וציוד חוץ"
        : "Textiles & outdoor"
      : locale === "he"
        ? "אלקטרוניקה וצריכה"
        : "Electronics & consumer";

  return {
    source: "mock",
    productName,
    brand,
    hsCode: overrides.hsCode?.trim() || defaultHs,
    origin:
      overrides.origin?.trim() ||
      (locale === "he" ? "סין / האיחוד האירופי" : "China / EU"),
    estimatedFobUsd,
    customsRatePercent,
    activeImportersCount,
    estimatedRoiPercent,
    totalUnitsImported,
    unitsDeltaPercent,
    customsIls: Math.round(customsIls),
    vatIls: Math.round(vatIls),
    vatRatePercent,
    localStores,
    suppliers,
    freightForwarders: [
      {
        id: "b1",
        name: locale === "he" ? "גלובל מכס בע\"מ" : "Global Customs Ltd.",
        specialty: freightSpecialty,
        port: locale === "he" ? "נמל אשדוד" : "Port of Ashdod",
        phone: "08-855-1200",
        rating: 4.8,
      },
      {
        id: "b2",
        name: locale === "he" ? "צפון שילוח בינלאומי" : "North International Freight",
        specialty: locale === "he" ? "ים + אוויר" : "Sea + air",
        port: locale === "he" ? "נמל חיפה" : "Port of Haifa",
        phone: "04-861-4400",
        rating: 4.6,
      },
      {
        id: "b3",
        name: locale === "he" ? "נתב\"ג אקספרס עמילות" : "TLV Express Brokers",
        specialty: locale === "he" ? "מסלול מהיר / דגימות" : "Fast track / samples",
        port: locale === "he" ? "נתב\"ג" : "Ben Gurion",
        phone: "03-975-3300",
        rating: 4.7,
      },
    ],
    importTrend,
    imageUrl: getProductImage(productName),
    defaults: {
      purchaseUsd: estimatedFobUsd,
      freightUsd,
      customsPct: customsRatePercent,
      localFeesIls,
      targetRetailIls,
      usdIls,
    },
  };
}

export function formatIls(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatUsd(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatInt(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-US").format(
    Math.round(value),
  );
}

export function formatPct(value: number, locale: Locale, digits = 1): string {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-US", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);
}
