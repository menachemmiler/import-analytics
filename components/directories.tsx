"use client";

import {
  BadgeCheck,
  Building2,
  Factory,
  Mail,
  Phone,
  Ship,
  Star,
  Store,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatIls, formatUsd } from "@/lib/mock-data";
import type { AnalysisResult, StockStatus } from "@/lib/types";
import { useLanguage } from "./language-provider";
import type { CopyKey } from "@/lib/i18n";

function stockKey(status: StockStatus): CopyKey {
  if (status === "in_stock") return "inStock";
  if (status === "low") return "lowStock";
  return "outStock";
}

export function Directories({ analysis }: { analysis: AnalysisResult }) {
  const { t, locale } = useLanguage();

  return (
    <div className="mx-auto mt-10 grid max-w-7xl gap-6 px-4 sm:px-6">
      <section id="retailers">
        <Header
          icon={Store}
          title={t("retailersTitle")}
          lead={t("retailersLead")}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {analysis.retailers.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{row.name}</p>
                  <p className="text-xs text-slate-400">
                    {row.city} · {row.channel}
                  </p>
                </div>
                <Building2 className="size-4 text-slate-500" />
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
            </article>
          ))}
        </div>
      </section>

      <section id="suppliers">
        <Header
          icon={Factory}
          title={t("suppliersTitle")}
          lead={t("suppliersLead")}
        />
        <div className="grid gap-3 lg:grid-cols-3">
          {analysis.suppliers.map((row) => (
            <article
              key={row.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{row.name}</p>
                  <p className="text-xs text-slate-400">{row.country}</p>
                </div>
                {row.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                    <BadgeCheck className="size-3" />
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
              <a
                href={`mailto:${row.email}`}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                <Mail className="size-4" />
                {t("contact")}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="brokers">
        <Header
          icon={Ship}
          title={t("brokersTitle")}
          lead={t("brokersLead")}
        />
        <div className="grid gap-3 lg:grid-cols-3">
          {analysis.brokers.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
            >
              <p className="font-semibold text-white">{row.name}</p>
              <p className="mt-1 text-xs text-slate-400">{row.specialty}</p>
              <p className="mt-2 text-sm text-slate-300">{row.port}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-sm text-amber-300">
                  <Star className="size-3.5 fill-amber-300" />
                  {row.rating.toFixed(1)} {t("rating")}
                </span>
                <a
                  href={`tel:${row.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
                >
                  <Phone className="size-3.5" />
                  {t("call")} · {row.phone}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Header({
  icon: Icon,
  title,
  lead,
}: {
  icon: typeof Store;
  title: string;
  lead: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-white/5 text-emerald-400">
        <Icon className="size-4" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400">{lead}</p>
      </div>
    </div>
  );
}
