import { useState } from "react";
import {
  BadgeCheck,
  ExternalLink,
  Factory,
  Mail,
  Phone,
  Ship,
  Star,
  Store,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatIls, formatUsd } from "@/lib/mock-data";
import type { AnalysisResult, StockStatus } from "@/lib/types";
import type { CopyKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { ImportTrendChart } from "./charts-panel";

type TabId = "stores" | "suppliers" | "freight" | "trends";

function stockKey(status: StockStatus): CopyKey {
  if (status === "in_stock") return "inStock";
  if (status === "low") return "lowStock";
  return "outStock";
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
            {analysis.localStores.map((row) => (
              <a
                key={row.id}
                href={row.directLink ?? row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-blue-400/40 hover:bg-slate-900/80"
              >
                <article>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{row.name}</h3>
                    <p className="text-xs text-slate-400">
                      {row.city} · {row.channel}
                    </p>
                  </div>
                  <ExternalLink className="size-4 text-slate-500" aria-hidden="true" />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[11px] text-slate-500">{t("price")}</p>
                    <p className="text-lg font-semibold text-white">
                      {formatIls(row.priceIls, locale)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      row.stock === "in_stock" && "bg-emerald-500/15 text-emerald-300",
                      row.stock === "low" && "bg-amber-500/15 text-amber-300",
                      row.stock === "out" && "bg-rose-500/15 text-rose-300",
                    )}
                  >
                    {t(stockKey(row.stock))}
                  </span>
                </div>
                <p className="mt-3 text-[11px] text-blue-300">{t("openListing")}</p>
                </article>
              </a>
            ))}
          </div>
        )}

        {tab === "suppliers" && (
          <div className="grid gap-3 lg:grid-cols-3">
            {analysis.suppliers.map((row) => (
              <article
                key={row.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white">{row.name}</h3>
                    <p className="text-xs text-slate-400">{row.country}</p>
                  </div>
                  {row.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                      <BadgeCheck className="size-3" aria-hidden="true" />
                      {t("verified")}
                    </span>
                  )}
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-900 p-2">
                    <dt className="text-[10px] text-slate-500">{t("fob")}</dt>
                    <dd className="text-sm font-semibold text-white">
                      {formatUsd(row.fobUsd, locale)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-900 p-2">
                    <dt className="text-[10px] text-slate-500">{t("moq")}</dt>
                    <dd className="text-sm font-semibold text-white">{row.moq}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-900 p-2">
                    <dt className="text-[10px] text-slate-500">{t("leadTime")}</dt>
                    <dd className="text-sm font-semibold text-white">
                      {row.leadDays} {t("days")}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 grid gap-2">
                  <a
                    href={row.directLink ?? row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    {t("openListing")}
                  </a>
                  <a
                    href={`mailto:${row.email}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    {t("contact")}
                  </a>
                </div>
              </article>
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
