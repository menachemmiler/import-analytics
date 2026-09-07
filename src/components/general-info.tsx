import { Factory, RefreshCw, Tag } from "lucide-react";
import { formatIls } from "@/lib/mock-data";
import type { AnalysisResult } from "@/lib/types";
import { useLanguage } from "./language-provider";

type GeneralInfoProps = {
  analysis: AnalysisResult | null;
  overloaded?: boolean;
  loading?: boolean;
  onRetry?: () => void;
};

export function GeneralInfo({
  analysis,
  overloaded = false,
  loading = false,
  onRetry,
}: GeneralInfoProps) {
  const { t, locale } = useLanguage();

  if (overloaded || !analysis) {
    return (
      <section
        id="dashboard"
        aria-labelledby="general-info-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6"
      >
        <article className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-slate-950 via-slate-950/90 to-amber-950/30 p-5 shadow-xl shadow-black/20 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="size-4 text-amber-300" aria-hidden="true" />
            <h2 id="general-info-heading" className="text-lg font-semibold text-white">
              {t("generalInfo")}
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-amber-100">{t("aiOverloaded")}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              {t("retryAnalysis")}
            </button>
          ) : null}
        </article>
      </section>
    );
  }

  const category = analysis.detectedCategory || analysis.category;
  const localPrice =
    analysis.estimatedRetailRangeIls ||
    (analysis.estimatedRetailIls > 0
      ? formatIls(analysis.estimatedRetailIls, locale)
      : t("sourceCountryUnknown"));

  return (
    <section
      id="dashboard"
      aria-labelledby="general-info-heading"
      className="mx-auto max-w-7xl px-4 sm:px-6"
    >
      <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950/90 to-blue-950/40 p-5 shadow-xl shadow-black/20 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Tag className="size-4 text-blue-300" aria-hidden="true" />
          <h2 id="general-info-heading" className="text-lg font-semibold text-white">
            {t("generalInfo")}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="inline-flex rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-100">
              {t("categoryTag")}: {category || "N/A"}
            </p>
          </div>

          <div>
            {analysis.isLocallyManufactured ? (
              <p className="text-sm font-bold text-emerald-300">
                {t("localProductionBadge")}
              </p>
            ) : analysis.sourceCountry ? (
              <p className="text-sm font-medium text-slate-200">
                {t("topManufacturingCountries")}: {analysis.sourceCountry}
              </p>
            ) : (
              <p className="text-sm text-slate-400">{t("sourceCountryUnknown")}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              {t("localAveragePrice")}: {localPrice}
            </p>
          </div>
        </div>

        {analysis.supplierChannel === "local-industrial" && analysis.supplierNotice ? (
          <p className="mt-4 inline-flex items-start gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            <Factory className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {analysis.supplierNotice}
          </p>
        ) : null}
      </article>
    </section>
  );
}
