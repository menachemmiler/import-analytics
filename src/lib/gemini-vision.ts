import { STRICT_ACCURACY_RULE } from "@/lib/ai-accuracy";
import { fetch as undiciFetch, ProxyAgent } from "undici";
import { englishSearchTerm } from "@/lib/marketplace-links";
import type { Locale } from "@/lib/types";

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

export type GeminiVisionResult = {
  productName: string;
  englishProductName: string;
  category: string;
  detectedCategory: string;
  detectedCategoryEn: string;
  hsCode: string;
  estimatedFobUsd: number;
  estimatedRetailIls: number;
  estimatedRetailIlsMin: number;
  estimatedRetailIlsMax: number;
  estimatedRetailRangeIls: string;
  estimatedSourceRetailIls: number;
  estimatedSourceRetailRangeIls: string;
  customsRatePercent: number;
  origin: string;
  sourceCountry: string | null;
  isLocallyManufactured: boolean;
  priceConfidence: "low" | "medium" | "high" | "na";
  viabilityNotes: string;
};

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  error?: { message?: string; code?: number; status?: string };
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
};

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODELS = ["gemini-2.5-pro", "gemini-1.5-flash"] as const;
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  PRIMARY_MODEL,
  ...FALLBACK_MODELS,
  "gemini-3.6-flash",
  "gemini-flash-latest",
].filter((model, index, list): model is string => {
  return Boolean(model) && list.indexOf(model) === index;
});

const REQUEST_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;

let didLogInit = false;

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim() || null;
  if (!didLogInit) {
    didLogInit = true;
    if (key) {
      console.info(
        `[gemini] Vision initialized. GEMINI_API_KEY loaded from environment. Primary model: ${PRIMARY_MODEL}.`,
      );
    } else {
      console.warn(
        "[gemini] GEMINI_API_KEY is missing or empty. Image recognition will return IMAGE_RECOGNITION_FAILED.",
      );
    }
  }
  return key;
}

getGeminiApiKey();

export function normalizeImagePayload(
  value: string | undefined,
  mimeHint?: string,
): { base64: string; mimeType: string } | null {
  if (!value || !value.trim()) return null;

  const trimmed = value.trim();
  const dataUrl = trimmed.match(
    /^data:([^;,]+)?(?:;charset=[^;]+)?;base64,([\s\S]+)$/i,
  );
  if (dataUrl) {
    const base64 = dataUrl[2].replace(/\s+/g, "");
    if (base64.length < 64) return null;
    return {
      mimeType: dataUrl[1] || mimeHint || "image/jpeg",
      base64,
    };
  }

  const marker = trimmed.toLowerCase().indexOf("base64,");
  if (marker >= 0) {
    const header = trimmed.slice(0, marker);
    const mime = header.match(/data:([^;]+)/i)?.[1];
    const base64 = trimmed.slice(marker + 7).replace(/\s+/g, "");
    if (base64.length < 64) return null;
    return {
      mimeType: mime || mimeHint || "image/jpeg",
      base64,
    };
  }

  const base64 = trimmed.replace(/\s+/g, "");
  if (base64.length < 64) return null;
  return {
    mimeType: mimeHint || "image/jpeg",
    base64,
  };
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const stripped = text.replace(/```json|```/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asPositiveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function formatRetailRange(min: number, max: number): string {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return `${Math.round(low)} - ${Math.round(high)} ILS`;
}

function parseRetailRange(json: Record<string, unknown> | null): {
  min: number;
  max: number;
  mid: number;
  label: string;
} {
  const min = asPositiveNumber(json?.estimatedRetailIlsMin);
  const max = asPositiveNumber(json?.estimatedRetailIlsMax);
  const single = asPositiveNumber(json?.estimatedRetailIls);
  const fromLabel =
    typeof json?.estimatedRetailRangeIls === "string"
      ? json.estimatedRetailRangeIls.match(/(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)/)
      : null;

  let low = min;
  let high = max;
  if (fromLabel && (!low || !high)) {
    const a = Number(fromLabel[1].replace(/,/g, ""));
    const b = Number(fromLabel[2].replace(/,/g, ""));
    if (a > 0 && b > 0) {
      low = Math.min(a, b);
      high = Math.max(a, b);
    }
  }
  if (low && high) {
    return {
      min: low,
      max: high,
      mid: Math.round((low + high) / 2),
      label: formatRetailRange(low, high),
    };
  }
  if (single) {
    const spread = Math.max(10, Math.round(single * 0.2));
    return {
      min: Math.max(1, single - spread),
      max: single + spread,
      mid: Math.round(single),
      label: formatRetailRange(single - spread, single + spread),
    };
  }
  return { min: 0, max: 0, mid: 0, label: "" };
}

function parseOptionalCountry(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    /^(n\/a|na|none|null|unknown|unknown origin|not detected|לא ידוע|לא זוהתה|מדינת מקור לא זוהתה)$/i.test(
      trimmed,
    )
  ) {
    return null;
  }
  return trimmed;
}

function parseLocallyManufactured(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return /^(true|yes|1|local|israel|ישראל)$/i.test(value.trim());
  }
  return false;
}

function parseConfidence(value: unknown): "low" | "medium" | "high" | "na" {
  if (typeof value !== "string") return "low";
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "high" || trimmed === "medium" || trimmed === "low") {
    return trimmed;
  }
  if (trimmed === "n/a" || trimmed === "na") return "na";
  return "low";
}

function asHsCode(value: unknown): string {
  if (typeof value !== "string") return "N/A";
  const trimmed = value.trim();
  if (!trimmed || /^n\/a$/i.test(trimmed)) return "N/A";
  return trimmed;
}

type GenerateOutcome =
  | { ok: true; text: string }
  | { ok: false; retryable: boolean; status?: number };

function isAbortLike(err: unknown): boolean {
  const rec =
    err && typeof err === "object"
      ? (err as { name?: unknown; code?: unknown })
      : null;
  return rec?.name === "AbortError" || rec?.code === 20;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithModel(
  model: string,
  apiKey: string,
  parts: Array<Record<string, unknown>>,
): Promise<GenerateOutcome> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  const clearAbortTimer = () => {
    if (timeout === undefined) return;
    clearTimeout(timeout);
    timeout = undefined;
  };

  try {
    const response = await undiciFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: STRICT_ACCURACY_RULE }],
          },
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
        dispatcher,
      },
    );

    clearAbortTimer();

    const rawBody = await response.text();
    let payload: GeminiResponse | null = null;
    try {
      payload = JSON.parse(rawBody) as GeminiResponse;
    } catch {
      payload = null;
    }

    const unavailable =
      response.status === 503 ||
      response.status === 429 ||
      payload?.error?.status === "UNAVAILABLE" ||
      payload?.error?.code === 503;

    if (!response.ok || payload?.error) {
      console.error("[Vision API Error]:", {
        model,
        status: response.status,
        error: payload?.error,
        body: rawBody.slice(0, 800),
      });
      return { ok: false, retryable: unavailable, status: response.status };
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim();
    if (!text) {
      return { ok: false, retryable: true, status: response.status };
    }
    return { ok: true, text };
  } catch (err) {
    const aborted = isAbortLike(err);
    if (aborted) {
      console.error("[Vision API Error]: Network/Firewall Blocked", err);
    } else {
      console.error("[Vision API Error]:", err);
    }
    return { ok: false, retryable: aborted };
  } finally {
    clearAbortTimer();
  }
}

async function generateWithBackoff(
  model: string,
  apiKey: string,
  parts: Array<Record<string, unknown>>,
): Promise<GenerateOutcome> {
  let last: GenerateOutcome = { ok: false, retryable: false };
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    last = await generateWithModel(model, apiKey, parts);
    if (last.ok) return last;
    if (!last.retryable) return last;
    if (attempt < MAX_RETRIES) {
      const delayMs = 500 * 2 ** attempt;
      console.warn(
        `[gemini] ${model} retryable failure; backing off ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`,
      );
      await sleep(delayMs);
    }
  }
  return last;
}

export type GeminiVisionLookup = {
  result: GeminiVisionResult | null;
  rawText: string | null;
  overloaded?: boolean;
};

export async function identifyProductWithGemini(input: {
  productName?: string;
  imageBase64?: string;
  imageMimeType?: string;
  imageName?: string;
  locale: Locale;
}): Promise<GeminiVisionLookup> {
  const empty: GeminiVisionLookup = { result: null, rawText: null, overloaded: false };

  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.error("[Vision API Error]:", "GEMINI_API_KEY is not configured");
      return { ...empty, overloaded: true };
    }

    const image = normalizeImagePayload(input.imageBase64, input.imageMimeType);
    const textHint = input.productName?.trim() || "";
    if (!image && !textHint) {
      console.error("[Vision API Error]:", "Product name or image is required");
      return empty;
    }

    const locale = input.locale;
    const prompt = `${STRICT_ACCURACY_RULE}

${image ? "Identify the product in this photo" : `Identify this product from the name "${textHint}"`} for Israel import planning.
Return JSON only with:
{
  "productName": "specific consumer product name in locale ${locale}",
  "englishProductName": "accurate English B2B search term for Alibaba / Made-in-China (Latin letters only)",
  "detectedCategory": "localized category name, e.g. חומרי בנייה וחיפוי or Building Materials",
  "detectedCategoryEn": "English category for B2B search, e.g. Building Materials, Electronics, Home Decor, Textiles",
  "category": "same as detectedCategoryEn",
  "isLocallyManufactured": false,
  "sourceCountry": "manufacturing/source country or null if unknown — never guess China by default",
  "hsCode": "6-digit HS if reasonably known, otherwise N/A",
  "estimatedFobUsd": number_or_null,
  "estimatedRetailIlsMin": number,
  "estimatedRetailIlsMax": number,
  "estimatedRetailRangeIls": "e.g. 120 - 180 ILS",
  "estimatedSourceRetailIlsMin": number_or_null,
  "estimatedSourceRetailIlsMax": number_or_null,
  "estimatedSourceRetailRangeIls": "source-country baseline range or N/A",
  "priceConfidence": "low | medium | high | na",
  "customsRatePercent": number_or_null,
  "origin": "same as sourceCountry or N/A",
  "viabilityNotes": "1-2 sentences in locale ${locale}"
}
Origin and pricing:
- Always provide an Israeli local average baseline range (low confidence if unknown).
- If sourceCountry is known, also provide a source-country average baseline range.
- If sourceCountry cannot be determined, set sourceCountry to null and estimatedSourceRetailRangeIls to N/A. Do NOT fabricate a source price or invent China/EU as origin.
- If the item is heavily manufactured in Israel (insulated panels, construction blocks, etc.), set isLocallyManufactured true, sourceCountry Israel, and explain that local manufacturing may beat import once freight is included.
Price rules:
- Return reasonable PRICE RANGES for the identified category, flagged as estimated baselines, never exact store quotes.
- Do not invent hardcoded metrics or arbitrary exact numbers.
Text hint: ${textHint || "(none)"}.`;

    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    if (image) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.base64,
        },
      });
    }

    let overloaded = false;
    for (const model of GEMINI_MODELS) {
      const outcome = await generateWithBackoff(model, apiKey, parts);
      if (!outcome.ok) {
        if (outcome.retryable) {
          overloaded = true;
          console.warn(`[gemini] Switching fallback model after ${model} 503/timeout`);
        }
        continue;
      }

      const text = outcome.text;

      const json = extractJsonObject(text);
      const productName =
        typeof json?.productName === "string" ? json.productName.trim() : "";
      if (!productName) {
        overloaded = true;
        continue;
      }

      const fob = asPositiveNumber(json?.estimatedFobUsd);
      const duty = asPositiveNumber(json?.customsRatePercent);
      const retail = parseRetailRange(json);
      const sourceRetail = parseRetailRange({
        estimatedRetailIlsMin: json?.estimatedSourceRetailIlsMin,
        estimatedRetailIlsMax: json?.estimatedSourceRetailIlsMax,
        estimatedRetailIls: json?.estimatedSourceRetailIls,
        estimatedRetailRangeIls: json?.estimatedSourceRetailRangeIls,
      });
      const englishProductName = englishSearchTerm(
        productName,
        typeof json?.englishProductName === "string"
          ? json.englishProductName
          : undefined,
      );
      const detectedCategoryEn =
        typeof json?.detectedCategoryEn === "string" && json.detectedCategoryEn.trim()
          ? json.detectedCategoryEn.trim()
          : typeof json?.category === "string" && json.category.trim()
            ? json.category.trim()
            : "";
      const detectedCategory =
        typeof json?.detectedCategory === "string" && json.detectedCategory.trim()
          ? json.detectedCategory.trim()
          : detectedCategoryEn;
      const isLocallyManufactured = parseLocallyManufactured(
        json?.isLocallyManufactured,
      );
      let sourceCountry = parseOptionalCountry(
        json?.sourceCountry ?? json?.origin,
      );
      if (isLocallyManufactured) {
        sourceCountry = sourceCountry || (locale === "he" ? "ישראל" : "Israel");
      }
      const sourceRangeKnown = Boolean(sourceCountry) && sourceRetail.mid > 0;

      return {
        rawText: text,
        result: {
          productName,
          englishProductName,
          category: detectedCategory,
          detectedCategory,
          detectedCategoryEn,
          hsCode: asHsCode(json?.hsCode),
          estimatedFobUsd: fob ?? 0,
          estimatedRetailIls: retail.mid,
          estimatedRetailIlsMin: retail.min,
          estimatedRetailIlsMax: retail.max,
          estimatedRetailRangeIls: retail.label,
          estimatedSourceRetailIls: sourceRangeKnown ? sourceRetail.mid : 0,
          estimatedSourceRetailRangeIls: sourceRangeKnown
            ? sourceRetail.label
            : "N/A",
          customsRatePercent: duty ?? 0,
          origin: sourceCountry || "N/A",
          sourceCountry,
          isLocallyManufactured,
          priceConfidence: parseConfidence(json?.priceConfidence),
          viabilityNotes:
            typeof json?.viabilityNotes === "string"
              ? json.viabilityNotes.trim()
              : "",
        },
      };
    }

    return { ...empty, overloaded };
  } catch (err) {
    console.error("[Vision API Error]:", err);
    return { ...empty, overloaded: true };
  }
}
