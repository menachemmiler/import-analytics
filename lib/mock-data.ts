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

export function buildAnalysis(
  query: string,
  locale: Locale,
): AnalysisResult {
  const q = query.trim() || "Dyson V15 Detect";
  const h = hashString(q.toLowerCase());
  const { productName, brand } = splitName(q);
  const months = locale === "he" ? MONTHS_HE : MONTHS_EN;
  const start = new Date(2023, 8, 1);

  const volume = Array.from({ length: 36 }, (_, i) => {
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

  const totalUnits = volume.reduce((sum, row) => sum + row.units, 0);
  const prior = volume.slice(0, 18).reduce((sum, row) => sum + row.units, 0);
  const recent = volume.slice(18).reduce((sum, row) => sum + row.units, 0);
  const unitsDelta = prior === 0 ? 0 : ((recent - prior) / prior) * 100;

  const purchaseUsd = Math.round(seeded(h, 48, 320, 11));
  const shippingUsd = Math.round(seeded(h, 6, 28, 12));
  const customsPct = Number(seeded(h, 0, 12, 13).toFixed(1));
  const localFeesIls = Math.round(seeded(h, 18, 75, 14));
  const usdIls = 3.72;
  const cifIls = (purchaseUsd + shippingUsd) * usdIls;
  const dutyIls = cifIls * (customsPct / 100);
  const vatIls = (cifIls + dutyIls + localFeesIls) * 0.18;
  const landed =
    cifIls + dutyIls + localFeesIls + vatIls;
  const targetRetailIls = Math.round(landed * seeded(h, 1.35, 1.95, 15));
  const roi = ((targetRetailIls - landed) / landed) * 100;

  return {
    productName,
    brand,
    hsCode: `85${String(h).slice(0, 6).padStart(6, "0")}`,
    origin: locale === "he" ? "סין / האיחוד האירופי" : "China / EU",
    kpis: {
      totalUnits,
      unitsDelta,
      activeImporters: Math.round(seeded(h, 7, 34, 21)),
      customsIls: Math.round(dutyIls),
      vatIls: Math.round(vatIls),
      dutyRate: customsPct,
      vatRate: 18,
      estimatedRoi: roi,
    },
    retailers: [
      {
        id: "r1",
        name: locale === "he" ? "KSP" : "KSP",
        city: locale === "he" ? "פתח תקווה" : "Petah Tikva",
        priceIls: targetRetailIls,
        stock: "in_stock",
        channel: locale === "he" ? "רשת" : "Chain",
      },
      {
        id: "r2",
        name: locale === "he" ? "אייבורי" : "Ivory",
        city: locale === "he" ? "ראשון לציון" : "Rishon LeZion",
        priceIls: Math.round(targetRetailIls * 1.04),
        stock: "low",
        channel: locale === "he" ? "רשת" : "Chain",
      },
      {
        id: "r3",
        name: "Amazon.co.il",
        city: locale === "he" ? "משלוח ארצי" : "Nationwide",
        priceIls: Math.round(targetRetailIls * 0.97),
        stock: "in_stock",
        channel: locale === "he" ? "אונליין" : "Online",
      },
      {
        id: "r4",
        name: locale === "he" ? "שופרסל" : "Shufersal",
        city: locale === "he" ? "תל אביב" : "Tel Aviv",
        priceIls: Math.round(targetRetailIls * 1.08),
        stock: "out",
        channel: locale === "he" ? "סופר" : "Grocery",
      },
      {
        id: "r5",
        name: locale === "he" ? "מחסני חשמל" : "Mahsanei Hashmal",
        city: locale === "he" ? "חיפה" : "Haifa",
        priceIls: Math.round(targetRetailIls * 1.02),
        stock: "in_stock",
        channel: locale === "he" ? "רשת" : "Chain",
      },
    ],
    suppliers: [
      {
        id: "s1",
        name: "Shenzhen Apex OEM Ltd.",
        country: locale === "he" ? "סין" : "China",
        fobUsd: purchaseUsd,
        moq: Math.round(seeded(h, 200, 1000, 31) / 50) * 50,
        leadDays: Math.round(seeded(h, 18, 45, 32)),
        email: "sales@apex-oem.cn",
        verified: true,
      },
      {
        id: "s2",
        name: "Ningbo Harbor Components",
        country: locale === "he" ? "סין" : "China",
        fobUsd: Math.round(purchaseUsd * 0.92),
        moq: Math.round(seeded(h, 500, 2000, 33) / 100) * 100,
        leadDays: Math.round(seeded(h, 25, 55, 34)),
        email: "export@nhc-global.com",
        verified: true,
      },
      {
        id: "s3",
        name: "GDK Electronics GmbH",
        country: locale === "he" ? "גרמניה" : "Germany",
        fobUsd: Math.round(purchaseUsd * 1.18),
        moq: Math.round(seeded(h, 50, 300, 35) / 10) * 10,
        leadDays: Math.round(seeded(h, 12, 28, 36)),
        email: "trade@gdk-electronics.de",
        verified: false,
      },
    ],
    brokers: [
      {
        id: "b1",
        name: locale === "he" ? "גלובל מכס בע\"מ" : "Global Customs Ltd.",
        specialty: locale === "he" ? "אלקטרוניקה וצריכה" : "Electronics & consumer",
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
    volume,
    defaults: {
      purchaseUsd,
      shippingUsd,
      customsPct,
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
