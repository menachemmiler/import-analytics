"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CalcInputs } from "./calculator";
import { landedCost } from "./calculator";
import { useLanguage } from "./language-provider";
import type { AnalysisResult } from "@/lib/types";

type ChartsPanelProps = {
  analysis: AnalysisResult;
  inputs: CalcInputs;
};

export function ChartsPanel({ analysis, inputs }: ChartsPanelProps) {
  const { t, locale, dir } = useLanguage();
  const result = landedCost(inputs);
  const purchaseIls = inputs.purchaseUsd * inputs.usdIls;
  const shippingIls = inputs.shippingUsd * inputs.usdIls;

  const breakdown = [
    { key: "purchase", name: t("purchase"), value: Math.max(purchaseIls, 0), fill: "#3b82f6" },
    { key: "shipping", name: t("shipping"), value: Math.max(shippingIls, 0), fill: "#38bdf8" },
    { key: "duty", name: t("customs"), value: Math.max(result.duty, 0), fill: "#818cf8" },
    { key: "fees", name: t("localFees"), value: Math.max(inputs.localFeesIls, 0), fill: "#34d399" },
    { key: "vat", name: t("vat"), value: Math.max(result.vat, 0), fill: "#fbbf24" },
  ];

  let running = 0;
  const waterfall = breakdown.map((row) => {
    const start = running;
    running += row.value;
    return { ...row, start, end: running };
  });

  const tooltipStyle = {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#e2e8f0",
    fontSize: 12,
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20">
        <h2 className="text-lg font-semibold text-white">{t("volumeTitle")}</h2>
        <p className="mb-4 mt-1 text-sm text-slate-400">{t("volumeLead")}</p>
        <div className="h-72 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analysis.volume} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                interval={5}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={48}
                orientation={dir === "rtl" ? "right" : "left"}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [
                  Number(value).toLocaleString(locale === "he" ? "he-IL" : "en-US"),
                  t("units"),
                ]}
              />
              <Area
                type="monotone"
                dataKey="units"
                stroke="#60a5fa"
                strokeWidth={2}
                fill="url(#volFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20">
        <h2 className="text-lg font-semibold text-white">{t("costTitle")}</h2>
        <p className="mb-4 mt-1 text-sm text-slate-400">{t("costLead")}</p>
        <div className="h-72 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfall} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, _name, item) => {
                  const payload = item?.payload as { value?: number } | undefined;
                  return [
                    `₪${Math.round(payload?.value ?? Number(value)).toLocaleString(locale === "he" ? "he-IL" : "en-US")}`,
                    t("landed"),
                  ];
                }}
              />
              <Bar dataKey="start" stackId="a" fill="transparent" />
              <Bar dataKey="value" stackId="a" radius={[6, 6, 0, 0]}>
                {waterfall.map((row) => (
                  <Cell key={row.key} fill={row.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
