import { useState } from "react";
import {
  ExternalLink,
  Factory,
  Phone,
  Ship,
  Star,
  Store,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatIls } from "@/lib/mock-data";
import type { AnalysisResult, MarketSearchLink } from "@/lib/types";
import type { CopyKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { ImportTrendChart } from "./charts-panel";

type TabId = "stores" | "suppliers" | "freight" | "trends";

function searchCopyKey(id: string): CopyKey {
  if (id === "alibaba") return "searchAlibaba";
  if (id === "made-in-china") return "searchMadeInChina";
  return "searchZap";
}

function SearchShortcutCard({ row }: { row: MarketSearchLink }) {
  const { t } = useLanguage();
  return (
    <a
      href={row.url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-blue-400/40 hover:bg-slate-900/80"
    >
      <article>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">{row.name}</h3>
            <p className="mt-1 text-xs text-slate-400">{t(searchCopyKey(row.id))}</p>
          </div>
          <ExternalLink className="size-4 text-slate-500" aria-hidden="true" />
        </div>
        <p className="mt-4 text-[11px] text-blue-300">{t("openListing")}</p>
      </article>
    </a>
  );
}

export function MarketTabs({ analysis }: { analysis: AnalysisResult }) {
  const { t, locale } = useLanguage();
  const [tab, setTab] = useState<TabId>("stores");

  const tabs: Array<{ id: TabId; label: string; icon: typeof Store }> = [
    { id: "stores", label: t("tabStores"), icon: Store },
    { id: "suppliers", label: t("tabSuppliers"), icon: Factory },
    { id: "freight", label: t("tabFreight"), icon: Ship },
    { id: "trends", label: t("tabTrends"), icon: TrendingUp },
  ];

  return (
    <section id="market-tabs" aria-labelledby="market-tabs-heading" className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
      <h2 id="market-tabs-heading" className="sr-only">
        {t("navMarket")}
      </h2>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-2" role="tablist">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "stores" && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {analysis.estimatedRetailIls > 0 && (
              <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 md:col-span-2 xl:col-span-3">
                <p className="text-[11px] text-slate-500">{t("estimatedRetail")}</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {formatIls(analysis.estimatedRetailIls, locale)}
                </p>
                <p className="mt-2 text-xs text-slate-400">{t("retailersLead")}</p>
              </article>
            )}
            {analysis.localStores.map((row) => (
              <SearchShortcutCard key={row.id} row={row} />
            ))}
          </div>
        )}

        {tab === "suppliers" && (
          <div className="grid gap-3 lg:grid-cols-2">
            {analysis.suppliers.map((row) => (
              <SearchShortcutCard key={row.id} row={row} />
            ))}
          </div>
        )}

        {tab === "freight" && (
          <div className="grid gap-3 lg:grid-cols-3">
            {analysis.freightForwarders.map((row) => (
              <article
                key={row.id}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
              >
                <h3 className="font-semibold text-white">{row.name}</h3>
                <p className="mt-1 text-xs text-slate-400">{row.specialty}</p>
                <p className="mt-2 text-sm text-slate-300">{row.port}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-sm text-amber-300">
                    <Star className="size-3.5 fill-amber-300" aria-hidden="true" />
                    {row.rating.toFixed(1)} {t("rating")}
                  </span>
                  <a
                    href={`tel:${row.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
                  >
                    <Phone className="size-3.5" aria-hidden="true" />
                    {t("call")} · {row.phone}
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "trends" && <ImportTrendChart analysis={analysis} />}
      </div>
    </section>
  );
}
