import { unstable_cache } from "next/cache";
import {
  FALLBACK_EUR_ILS,
  FALLBACK_USD_ILS,
  type ExchangeRateQuote,
} from "@/lib/fx";

const USD_FEED = "https://open.er-api.com/v6/latest/USD";
const REVALIDATE_SECONDS = 60 * 60;

type OpenErApiResponse = {
  result?: string;
  provider?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
};

function fallbackQuote(): ExchangeRateQuote {
  return {
    usdIls: FALLBACK_USD_ILS,
    eurIls: FALLBACK_EUR_ILS,
    source: "fallback",
    fetchedAt: new Date().toISOString(),
    provider: "fallback",
  };
}

function isPositiveRate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

async function fetchLiveQuote(): Promise<ExchangeRateQuote> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(USD_FEED, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Exchange API HTTP ${response.status}`);
    }

    const payload = (await response.json()) as OpenErApiResponse;
    const usdIls = payload.rates?.ILS;
    const usdEur = payload.rates?.EUR;

    if (payload.result !== "success" || !isPositiveRate(usdIls)) {
      throw new Error("Exchange API returned an invalid ILS rate");
    }

    const eurIls = isPositiveRate(usdEur) ? usdIls / usdEur : FALLBACK_EUR_ILS;

    return {
      usdIls: Number(usdIls.toFixed(4)),
      eurIls: Number(eurIls.toFixed(4)),
      source: "live",
      fetchedAt: payload.time_last_update_utc
        ? new Date(payload.time_last_update_utc).toISOString()
        : new Date().toISOString(),
      provider: payload.provider ?? "open.er-api.com",
    };
  } finally {
    clearTimeout(timeout);
  }
}

const getCachedLiveQuote = unstable_cache(
  async (): Promise<ExchangeRateQuote> => fetchLiveQuote(),
  ["exchange-rates-usd-eur-ils"],
  { revalidate: REVALIDATE_SECONDS },
);

export async function getExchangeRates(): Promise<ExchangeRateQuote> {
  try {
    return await getCachedLiveQuote();
  } catch {
    return fallbackQuote();
  }
}
