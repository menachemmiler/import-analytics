"use client";

import { ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatIls, formatPct } from "@/lib/mock-data";
import { useLanguage } from "./language-provider";

export type CalcInputs = {
  purchaseUsd: number;
  shippingUsd: number;
  customsPct: number;
  localFeesIls: number;
  targetRetailIls: number;
  usdIls: number;
};

export function landedCost(inputs: CalcInputs) {
  const cifIls = (inputs.purchaseUsd + inputs.shippingUsd) * inputs.usdIls;
  const duty = cifIls * (inputs.customsPct / 100);
  const pretax = cifIls + duty + inputs.localFeesIls;
  const vat = pretax * 0.18;
  const landed = pretax + vat;
  const profit = inputs.targetRetailIls - landed;
  const margin =
    inputs.targetRetailIls > 0 ? (profit / inputs.targetRetailIls) * 100 : 0;
  return { cifIls, duty, vat, pretax, landed, profit, margin };
}

type CalculatorProps = {
  inputs: CalcInputs;
  onChange: (next: CalcInputs) => void;
};

export function Calculator({ inputs, onChange }: CalculatorProps) {
  const { t, locale } = useLanguage();
  const result = landedCost(inputs);
  const status =
    result.margin >= 25 ? "high" : result.margin >= 10 ? "ok" : "risk";

  function field(key: keyof CalcInputs, label: string, step = 1) {
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">
          {label}
        </span>
        <input
          type="number"
          min={0}
          step={step}
          value={Number.isFinite(inputs[key]) ? inputs[key] : 0}
          onChange={(e) =>
            onChange({ ...inputs, [key]: Number(e.target.value) })
          }
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/30"
        />
      </label>
    );
  }

  return (
    <section
      id="calculator"
      className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-black/20"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">{t("calcTitle")}</h2>
        <p className="mt-1 text-sm text-slate-400">{t("calcLead")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {field("purchaseUsd", t("purchase"), 1)}
        {field("shippingUsd", t("shipping"), 1)}
        {field("customsPct", t("customsPct"), 0.1)}
        {field("localFeesIls", t("localFees"), 1)}
        {field("targetRetailIls", t("targetRetail"), 1)}
        {field("usdIls", t("usdIls"), 0.01)}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric label={t("landed")} value={formatIls(result.landed, locale)} />
        <Metric label={t("margin")} value={formatPct(result.margin, locale)} />
        <Metric label={t("profit")} value={formatIls(result.profit, locale)} />
      </div>

      <div
        className={cn(
          "mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold",
          status === "high" && "bg-emerald-500/15 text-emerald-300",
          status === "ok" && "bg-blue-500/15 text-blue-300",
          status === "risk" && "bg-rose-500/15 text-rose-300",
        )}
      >
        {status === "high" && <TrendingUp className="size-4" />}
        {status === "ok" && <Sparkles className="size-4" />}
        {status === "risk" && <ShieldAlert className="size-4" />}
        {status === "high"
          ? t("statusHigh")
          : status === "risk"
            ? t("statusRisk")
            : t("statusOk")}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
