import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { StructuredData } from "@/components/StructuredData";
import {
  DEFAULT_FAQ_ITEMS,
  faqPageJsonLd,
  financialCalculatorJsonLd,
  siteGraphJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <StructuredData
        data={siteGraphJsonLd([
          financialCalculatorJsonLd(),
          faqPageJsonLd(DEFAULT_FAQ_ITEMS),
        ])}
      />
      <Dashboard />
    </>
  );
}
