"use client";

import { useEffect, useState } from "react";
import { Header } from "./header";
import { HeroSearch } from "./hero-search";
import { KpiCards } from "./kpi-cards";
import { Calculator, type CalcInputs } from "./calculator";
import { ChartsPanel } from "./charts-panel";
import { Directories } from "./directories";
import { LanguageProvider, useLanguage } from "./language-provider";
import { buildAnalysis } from "@/lib/mock-data";
import type { AnalysisResult, UserSession } from "@/lib/types";

const emptyCalc: CalcInputs = {
  purchaseUsd: 0,
  shippingUsd: 0,
  customsPct: 0,
  localFeesIls: 0,
  targetRetailIls: 0,
  usdIls: 3.72,
};

function DashboardInner() {
  const { locale, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [inputs, setInputs] = useState<CalcInputs>(emptyCalc);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!analysis) return;
    setAnalysis(buildAnalysis(query || analysis.productName, locale));
    // Preserve calculator inputs across language switches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  function runAnalysis() {
    setLoading(true);
    window.setTimeout(() => {
      const next = buildAnalysis(query, locale);
      setAnalysis(next);
      setInputs({ ...next.defaults });
      setLoading(false);
      document.getElementById("dashboard")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 1400);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header
        user={user}
        onSignIn={() =>
          setUser({
            name: locale === "he" ? "משתמש Google" : "Google User",
            email: "importer@gmail.com",
          })
        }
        onSignOut={() => setUser(null)}
      />
      <main className="flex-1 pb-16">
        <HeroSearch
          query={query}
          onQueryChange={setQuery}
          previewUrl={previewUrl}
          onFile={setFile}
          loading={loading}
          onAnalyze={runAnalysis}
        />

        {analysis && (
          <div className="space-y-10">
            <KpiCards analysis={analysis} />
            <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 xl:grid-cols-2">
              <Calculator inputs={inputs} onChange={setInputs} />
              <ChartsPanel analysis={analysis} inputs={inputs} />
            </div>
            <Directories analysis={analysis} />
          </div>
        )}
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        {t("footer")}
      </footer>
    </div>
  );
}

export function Dashboard() {
  return (
    <LanguageProvider>
      <DashboardInner />
    </LanguageProvider>
  );
}
