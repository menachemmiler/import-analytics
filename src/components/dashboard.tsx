"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/header";
import { HeroSearch } from "@/components/hero-search";
import { KpiCards } from "@/components/kpi-cards";
import {
  Calculator,
  defaultCalcInputs,
  type CalcInputs,
} from "@/components/calculator";
import { CostBreakdownChart } from "@/components/charts-panel";
import { MarketTabs } from "@/components/market-tabs";
import { Faq } from "@/components/faq";
import { useLanguage } from "@/components/language-provider";
import type { AnalysisResult, UserSession } from "@/lib/types";
import type { FeasibilityApiResponse } from "@/lib/fx";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function DashboardPage() {
  const { locale, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [inputs, setInputs] = useState<CalcInputs>(defaultCalcInputs);
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

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const imageDataUrl = file ? await fileToDataUrl(file) : "";
      const response = await fetch("/api/analyze-feasibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: query.trim(),
          category: "",
          estimatedCost: 0,
          weight: 1,
          shippingType: "sea",
          locale,
          includeDashboard: true,
          imageBase64: imageDataUrl || undefined,
          imageMimeType: file?.type || undefined,
          imageName: file?.name || undefined,
        }),
      });
      const payload = (await response.json()) as
        | FeasibilityApiResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(t("analyzeError"));
      }

      if ("success" in payload && payload.success === false) {
        setAnalysis(null);
        setError(t("imageRecognitionFailed"));
        return;
      }

      if (!("success" in payload) || !payload.dashboard) {
        throw new Error("analyze_failed");
      }

      const identifiedName = payload.productName.trim() || query.trim();
      if (identifiedName) {
        setQuery(identifiedName);
      }

      setAnalysis({
        ...payload.dashboard,
        productName: identifiedName || payload.dashboard.productName,
      });
      setInputs({
        purchaseUsd: payload.dashboard.defaults.purchaseUsd,
        freightUsd: payload.dashboard.defaults.freightUsd,
        customsPct: payload.dashboard.defaults.customsPct,
        localFeesIls: payload.dashboard.defaults.localFeesIls,
        targetRetailIls: payload.dashboard.defaults.targetRetailIls,
        usdIls: payload.dashboard.defaults.usdIls,
      });
      window.requestAnimationFrame(() => {
        document.getElementById("dashboard")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch {
      setError(t("analyzeError"));
    } finally {
      setLoading(false);
    }
  }, [file, locale, query, t]);

  useEffect(() => {
    if (!analysis) return;
    void runAnalysis();
    // Re-fetch localized lists when HE/EN changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

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
      <main id="main" className="flex-1 pb-16">
        <HeroSearch
          query={query}
          onQueryChange={setQuery}
          imageUrl={previewUrl ?? analysis?.imageUrl ?? null}
          productName={analysis?.productName ?? query}
          imageLoading={loading}
          onFile={setFile}
          canClear={Boolean(file)}
          loading={loading}
          error={error}
          onAnalyze={() => {
            void runAnalysis();
          }}
        />

        {analysis && (
          <article className="space-y-10">
            <KpiCards
              analysis={{
                ...analysis,
                imageUrl: previewUrl ?? analysis.imageUrl,
              }}
            />
            <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 xl:grid-cols-2">
              <Calculator
                inputs={inputs}
                onChange={setInputs}
                productHint={analysis.productName}
              />
              <CostBreakdownChart inputs={inputs} />
            </div>
            <MarketTabs analysis={analysis} />
          </article>
        )}
        <Faq />
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        {t("footer")}
      </footer>
    </div>
  );
}

export function Dashboard() {
  return <DashboardPage />;
}

export default Dashboard;
