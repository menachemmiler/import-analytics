import type { Metadata } from "next";
import { CalculatorWorkspace } from "@/components/calculator-workspace";
import { StructuredData } from "@/components/StructuredData";
import {
  DEFAULT_FAQ_ITEMS,
  faqPageJsonLd,
  financialCalculatorJsonLd,
  siteGraphJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Landed Cost Calculator",
  description:
    "Calculate Israeli import landed cost in ILS: purchase, freight, customs duty, local fees, VAT, unit profit, and margin.",
  keywords: [
    "landed cost calculator",
    "import profitability",
    "Israel customs",
    "VAT",
    "USD ILS",
    "מחשבון עלות נחיתה",
  ],
  alternates: {
    canonical: "/calculator",
  },
  openGraph: {
    title: "Landed Cost Calculator",
    description:
      "Live USD/ILS landed-cost and margin calculator for Israeli importers.",
    url: "/calculator",
  },
  twitter: {
    title: "Landed Cost Calculator",
    description:
      "Live USD/ILS landed-cost and margin calculator for Israeli importers.",
  },
};

export default function CalculatorPage() {
  return (
    <>
      <StructuredData
        data={siteGraphJsonLd([
          financialCalculatorJsonLd(),
          faqPageJsonLd(DEFAULT_FAQ_ITEMS),
        ])}
      />
      <CalculatorWorkspace />
    </>
  );
}
