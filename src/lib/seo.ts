import { copy } from "@/lib/i18n";

export type JsonLd = Record<string, unknown>;

export const SITE_NAME = "Import Intelligence Dashboard";
export const SITE_BRAND = "Netiv";
export const DEFAULT_TITLE = "Import Feasibility & Market Intelligence";

export const SITE_DESCRIPTION =
  "לוח בקרה לכדאיות ייבוא: עלות נחיתה, מתחרים בישראל, ספקים גלובליים ועמילי מכס. Analyze landed cost, Israeli retail competitors, global suppliers, and customs brokers in one dashboard.";

export const SITE_KEYWORDS = [
  "import feasibility",
  "landed cost calculator",
  "Israel import",
  "customs duty",
  "VAT Israel",
  "HS code",
  "market intelligence",
  "FOB",
  "suppliers",
  "customs brokers",
  "כדאיות ייבוא",
  "עלות נחיתה",
  "מכס",
  "עמילי מכס",
];

export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (!fromEnv) {
    return "http://localhost:3000";
  }

  const trimmed = fromEnv.replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function absoluteUrl(path = "/"): string {
  const origin = getSiteUrl();
  if (path === "/" || path === "") {
    return origin;
  }
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

const ORGANIZATION_ID = "#organization";
const WEB_APP_ID = "#webapp";
const CALCULATOR_ID = "#calculator";
const FAQ_ID = "#faq";

export function organizationJsonLd(): JsonLd {
  return {
    "@type": "Organization",
    "@id": absoluteUrl(ORGANIZATION_ID),
    name: SITE_BRAND,
    url: absoluteUrl(),
    description: SITE_DESCRIPTION,
  };
}

export function webApplicationJsonLd(): JsonLd {
  return {
    "@type": "WebApplication",
    "@id": absoluteUrl(WEB_APP_ID),
    name: `${SITE_BRAND} | ${SITE_NAME}`,
    url: absoluteUrl(),
    description: SITE_DESCRIPTION,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["he", "en"],
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ILS",
    },
    publisher: { "@id": absoluteUrl(ORGANIZATION_ID) },
  };
}

export function financialCalculatorJsonLd(): JsonLd {
  return {
    "@type": "FinancialCalculator",
    "@id": absoluteUrl(CALCULATOR_ID),
    name: "Landed cost & profitability calculator",
    url: absoluteUrl("/calculator"),
    description:
      "Live import landed-cost calculator using purchase price, freight, Israeli customs duty, local fees, VAT, and USD/ILS.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    isPartOf: { "@id": absoluteUrl(WEB_APP_ID) },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ILS",
    },
  };
}

export type FaqItem = {
  question: string;
  answer: string;
};

export function faqPageJsonLd(items: FaqItem[]): JsonLd {
  return {
    "@type": "FAQPage",
    "@id": absoluteUrl(FAQ_ID),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  { question: copy.he.faq1q, answer: copy.he.faq1a },
  { question: copy.he.faq2q, answer: copy.he.faq2a },
  { question: copy.he.faq3q, answer: copy.he.faq3a },
  { question: copy.he.faq4q, answer: copy.he.faq4a },
];

export function siteGraphJsonLd(extra: JsonLd[] = []): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationJsonLd(), webApplicationJsonLd(), ...extra],
  };
}
