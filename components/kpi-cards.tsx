"use client";

import {
  BadgePercent,
  Landmark,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatIls, formatInt, formatPct } from "@/lib/mock-data";
import type { AnalysisResult } from "@/lib/types";
import { useLanguage } from "./language-provider";

export function KpiCards({ analysis }: { analysis: AnalysisResult }) {
  const { t, locale } = useLanguage();
  const { kpis } = analysis;
  const up = kpis.unitsDelta >= 0;

  const cards = [
    {
      label: t("kpiUnits"),
      value: formatInt(kpis.totalUnits, locale),
      hint: t("last36"),
      delta: `${up ? "+" : ""}${kpis.unitsDelta.toFixed(1)}% ${t("vsPrior")}`,
      icon: Package,
      tone: "from-blue-500/20 to-blue-500/5 text-blue-300",
    },
    {
      label: t("kpiImporters"),
      value: formatInt(kpis.activeImporters, locale),
      hint: analysis.origin,
      delta: `${t("hsCode")} ${analysis.hsCode}`,
      icon: Users,
      tone: "from-emerald-500/20 to-emerald-500/5 text-emerald-300",
    },
    {
      label: t("kpiTax"),
      value: formatIls(kpis.customsIls + kpis.vatIls, locale),
      hint: `${t("customs")} ${formatIls(kpis.customsIls, locale)} · ${t("vat")} ${formatIls(kpis.vatIls, locale)}`,
      delta: `${t("customs")} ${formatPct(kpis.dutyRate, locale)} · ${t("vat")} ${formatPct(kpis.vatRate, locale, 0)}`,
      icon: Landmark,
      tone: "from-sky-500/20 to-sky-500/5 text-sky-300",
    },
    {
      label: t("kpiRoi"),
      value: formatPct(kpis.estimatedRoi, locale),
      hint: t("perUnit"),
      delta: analysis.productName,
      icon: kpis.estimatedRoi >= 20 ? TrendingUp : BadgePercent,
      tone:
        kpis.estimatedRoi >= 20
          ? "from-emerald-400/25 to-emerald-500/5 text-emerald-300"
          : "from-amber-500/20 to-amber-500/5 text-amber-300",
    },
  ];

  return (
    <section id="dashboard" className="mx-auto max-w-7xl px-4 sm:px-6">
      <p className="mb-4 text-sm text-slate-400">
        {t("analysisFor")}{" "}
        <span className="font-medium text-white">{analysis.productName}</span>
        <span className="text-slate-500"> · {analysis.brand}</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {card.value}
                  </p>
                </div>
                <span
                  className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.tone}`}
                >
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{card.hint}</p>
              <p className="mt-1 text-xs text-slate-300">{card.delta}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
