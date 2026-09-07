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
import { ProductPhoto } from "./product-photo";

export function KpiCards({ analysis }: { analysis: AnalysisResult }) {
  const { t, locale } = useLanguage();
  const up = analysis.unitsDeltaPercent >= 0;

  const cards = [
    {
      label: t("kpiUnits"),
      value: formatInt(analysis.totalUnitsImported, locale),
      hint: t("last36"),
      delta: `${up ? "+" : ""}${analysis.unitsDeltaPercent.toFixed(1)}% ${t("vsPrior")}`,
      icon: Package,
      tone: "from-blue-500/20 to-blue-500/5 text-blue-300",
    },
    {
      label: t("kpiImporters"),
      value: formatInt(analysis.activeImportersCount, locale),
      hint: analysis.sourceCountry || t("sourceCountryUnknown"),
      delta: `${t("hsCode")} ${analysis.hsCode}`,
      icon: Users,
      tone: "from-emerald-500/20 to-emerald-500/5 text-emerald-300",
    },
    {
      label: t("kpiTax"),
      value: formatIls(analysis.customsIls + analysis.vatIls, locale),
      hint: `${t("customs")} ${formatIls(analysis.customsIls, locale)} · ${t("vat")} ${formatIls(analysis.vatIls, locale)}`,
      delta: `${t("customs")} ${formatPct(analysis.customsRatePercent, locale)} · ${t("vat")} ${formatPct(analysis.vatRatePercent, locale, 0)}`,
      icon: Landmark,
      tone: "from-sky-500/20 to-sky-500/5 text-sky-300",
    },
    {
      label: t("kpiRoi"),
      value: formatPct(analysis.estimatedRoiPercent, locale),
      hint: t("perUnit"),
      delta: `FOB ${formatInt(analysis.estimatedFobUsd, locale)} $`,
      icon: analysis.estimatedRoiPercent >= 20 ? TrendingUp : BadgePercent,
      tone:
        analysis.estimatedRoiPercent >= 20
          ? "from-emerald-400/25 to-emerald-500/5 text-emerald-300"
          : "from-amber-500/20 to-amber-500/5 text-amber-300",
    },
  ];

  return (
    <section aria-labelledby="analysis-heading" className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-4 flex items-center gap-3">
        {analysis.imageUrl ? (
          <ProductPhoto
            src={analysis.imageUrl}
            alt={analysis.productName}
            overlay={false}
            className="size-14 shrink-0 rounded-xl"
          />
        ) : (
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900"
            aria-hidden="true"
          >
            <Package className="size-6 text-slate-500" />
          </div>
        )}
        <h2 id="analysis-heading" className="text-sm text-slate-400">
          {t("analysisFor")}{" "}
          <span className="font-medium text-white">{analysis.productName}</span>
        </h2>
      </div>
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
                  <h3 className="text-xs font-medium text-slate-400">{card.label}</h3>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {card.value}
                  </p>
                </div>
                <span
                  className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.tone}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
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
