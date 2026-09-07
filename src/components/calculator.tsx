import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, RefreshCw, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatIls, formatPct } from "@/lib/mock-data";
import {
  defaultCalcInputs,
  landedCost,
  type CalcInputs,
} from "@/lib/landed-cost";
import type {
  ExchangeRateQuote,
  FeasibilityAnalysis,
  FeasibilityApiResponse,
  FeasibilityRating,
  ShippingType,
} from "@/lib/fx";
import { AI_OVERLOADED } from "@/lib/fx";
import { useLanguage } from "./language-provider";

export type { CalcInputs };
export { defaultCalcInputs, landedCost };

type CalculatorProps = {
  inputs: CalcInputs;
  onChange: (next: CalcInputs) => void;
  titleAs?: "h1" | "h2";
  productHint?: string;
};

type RateStatus = "idle" | "loading" | "live" | "fallback" | "error";

function ratingCopyKey(
  rating: FeasibilityRating,
): "ratingHigh" | "ratingModerate" | "ratingLow" | "ratingUnviable" {
  if (rating === "high") return "ratingHigh";
  if (rating === "moderate") return "ratingModerate";
  if (rating === "low") return "ratingLow";
  return "ratingUnviable";
}

export function Calculator({
  inputs,
  onChange,
  titleAs = "h2",
  productHint = "",
}: CalculatorProps) {
  const { t, locale } = useLanguage();
  const result = landedCost(inputs);
  const status =
    result.margin >= 25 ? "high" : result.margin >= 10 ? "ok" : "risk";
  const Title = titleAs;

  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const overriddenRef = useRef(false);

  const [rateStatus, setRateStatus] = useState<RateStatus>("idle");
  const [quote, setQuote] = useState<ExchangeRateQuote | null>(null);
  const [rateMessage, setRateMessage] = useState<string | null>(null);
  const [usdIlsOverridden, setUsdIlsOverridden] = useState(false);

  const [productName, setProductName] = useState(productHint);
  const [category, setCategory] = useState("");
  const [weight, setWeight] = useState(1);
  const [shippingType, setShippingType] = useState<ShippingType>("sea");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<FeasibilityAnalysis | null>(null);

  useEffect(() => {
    if (productHint) {
      setProductName(productHint);
    }
  }, [productHint]);

  async function applyQuote(next: ExchangeRateQuote, force: boolean) {
    setQuote(next);
    setRateStatus(next.source === "live" ? "live" : "fallback");
    setRateMessage(next.source === "live" ? null : t("rateError"));
    if (!force && overriddenRef.current) return;
    onChangeRef.current({ ...inputsRef.current, usdIls: next.usdIls });
  }

  async function loadRates(force = false) {
    setRateStatus("loading");
    setRateMessage(null);
    try {
      const response = await fetch("/api/exchange-rate");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as ExchangeRateQuote;
      if (!Number.isFinite(data.usdIls) || data.usdIls <= 0) {
        throw new Error("Invalid USD/ILS rate");
      }
      await applyQuote(data, force);
    } catch {
      setRateStatus("error");
      setRateMessage(t("rateError"));
    }
  }

  useEffect(() => {
    void loadRates(false);
    // Load once when the calculator mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          onChange={(e) => {
            const value = Number(e.target.value);
            if (key === "usdIls") {
              overriddenRef.current = true;
              setUsdIlsOverridden(true);
            }
            onChange({ ...inputs, [key]: value });
          }}
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/30"
        />
      </label>
    );
  }

  async function runAiAnalysis() {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/analyze-feasibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim() || productHint,
          category: category.trim(),
          estimatedCost: inputs.purchaseUsd,
          weight,
          shippingType,
          purchaseUsd: inputs.purchaseUsd,
          freightUsd: inputs.freightUsd,
          customsPct: inputs.customsPct,
          localFeesIls: inputs.localFeesIls,
          targetRetailIls: inputs.targetRetailIls,
          usdIls: inputs.usdIls,
          locale,
        }),
      });
      const payload = (await response.json()) as
        | FeasibilityApiResponse
        | { error?: string };
      if (
        response.status === 503 ||
        ("success" in payload &&
          payload.success === false &&
          payload.error === AI_OVERLOADED)
      ) {
        setAiResult(null);
        setAiError(t("aiOverloaded"));
        return;
      }
      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? String(payload.error)
            : t("aiError"),
        );
      }
      if ("success" in payload && payload.success === false) {
        setAiResult(null);
        setAiError(t("imageRecognitionFailed"));
        return;
      }
      if (!("profitabilityRating" in payload)) {
        throw new Error(t("aiError"));
      }
      setAiResult(payload);
    } catch (error) {
      setAiResult(null);
      setAiError(error instanceof Error ? error.message : t("aiError"));
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <section
      id="calculator"
      className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-black/20"
    >
      <div className="mb-6">
        <Title
          className={
            titleAs === "h1"
              ? "text-2xl font-semibold tracking-tight text-white sm:text-3xl"
              : "text-lg font-semibold text-white"
          }
        >
          {t("calcTitle")}
        </Title>
        <p className="mt-1 text-sm text-slate-400">{t("calcLead")}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 font-semibold",
            rateStatus === "live" && "bg-emerald-500/15 text-emerald-300",
            rateStatus === "fallback" && "bg-amber-500/15 text-amber-300",
            rateStatus === "error" && "bg-rose-500/15 text-rose-300",
            (rateStatus === "loading" || rateStatus === "idle") &&
              "bg-slate-800 text-slate-300",
          )}
        >
          {rateStatus === "loading" || rateStatus === "idle"
            ? t("rateLoading")
            : rateStatus === "live"
              ? t("liveRate")
              : rateStatus === "fallback"
                ? t("fallbackRate")
                : t("rateError")}
        </span>
        {quote ? (
          <span className="text-slate-400">
            USD/ILS {quote.usdIls.toFixed(4)} · {t("eurIls")}{" "}
            {quote.eurIls.toFixed(4)}
          </span>
        ) : null}
        {usdIlsOverridden ? (
          <span className="rounded-full bg-white/5 px-2 py-1 text-slate-300">
            {t("rateManual")}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => {
            overriddenRef.current = false;
            setUsdIlsOverridden(false);
            void loadRates(true);
          }}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-slate-200 hover:bg-white/5"
        >
          <RefreshCw className="size-3" aria-hidden="true" />
          {t("useLiveRate")}
        </button>
      </div>
      {rateMessage ? (
        <p className="mb-4 text-xs text-amber-300">{rateMessage}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {field("purchaseUsd", t("purchase"), 1)}
        {field("freightUsd", t("freight"), 1)}
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
        {status === "high" && <TrendingUp className="size-4" aria-hidden="true" />}
        {status === "ok" && <Sparkles className="size-4" aria-hidden="true" />}
        {status === "risk" && <ShieldAlert className="size-4" aria-hidden="true" />}
        {status === "high"
          ? t("statusHigh")
          : status === "risk"
            ? t("statusRisk")
            : t("statusOk")}
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold text-white">{t("aiInsights")}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              {t("aiProduct")}
            </span>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400/50"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              {t("aiCategory")}
            </span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400/50"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              {t("aiWeight")}
            </span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400/50"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              {t("aiShipping")}
            </span>
            <select
              value={shippingType}
              onChange={(e) => setShippingType(e.target.value as ShippingType)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400/50"
            >
              <option value="sea">{t("shipSea")}</option>
              <option value="air">{t("shipAir")}</option>
              <option value="express">{t("shipExpress")}</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => void runAiAnalysis()}
          disabled={aiLoading}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-80"
        >
          {aiLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Bot className="size-4" aria-hidden="true" />
          )}
          {aiLoading ? t("analyzingAi") : t("analyzeAi")}
        </button>
        {aiError ? (
          <div
            role="alert"
            className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm leading-relaxed text-rose-100"
          >
            {aiError}
          </div>
        ) : null}

        {aiResult ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-300">
                {aiResult.source === "gemini" || aiResult.source === "ai"
                  ? t("aiSourceLive")
                  : t("aiSourceMock")}
              </span>
              <span className="text-sm font-semibold text-white">
                {t("aiScore")}: {aiResult.profitabilityScore}/100 ·{" "}
                {t(ratingCopyKey(aiResult.profitabilityRating))}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              {aiResult.summary}
            </p>
            <p className="text-xs text-slate-500">
              {t("aiDutyRange")}: {aiResult.estimatedDutyRangePercent.min}%–
              {aiResult.estimatedDutyRangePercent.max}%
            </p>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t("aiRisks")}
              </h4>
              <ul className="mt-2 space-y-2">
                {aiResult.riskFactors.map((risk) => (
                  <li key={risk.title} className="text-sm text-slate-300">
                    <span
                      className={cn(
                        "me-2 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        risk.severity === "high" && "bg-rose-500/15 text-rose-300",
                        risk.severity === "medium" &&
                          "bg-amber-500/15 text-amber-300",
                        risk.severity === "low" &&
                          "bg-emerald-500/15 text-emerald-300",
                      )}
                    >
                      {risk.severity}
                    </span>
                    <strong className="text-white">{risk.title}.</strong>{" "}
                    {risk.detail}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t("aiOpportunities")}
              </h4>
              <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-slate-300">
                {aiResult.opportunities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t("aiActions")}
              </h4>
              <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-slate-300">
                {aiResult.recommendedActions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-slate-500">{aiResult.notes}</p>
          </div>
        ) : null}
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
