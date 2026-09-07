import { fetch as undiciFetch, ProxyAgent } from "undici";
import type { Locale } from "@/lib/types";

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

export type GeminiVisionResult = {
  productName: string;
  category: string;
  hsCode: string;
  estimatedFobUsd: number;
  estimatedRetailIls: number;
  customsRatePercent: number;
  origin: string;
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

const PRIMARY_MODEL = "gemini-3.6-flash";
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  PRIMARY_MODEL,
  "gemini-flash-latest",
].filter((model, index, list): model is string => {
  return Boolean(model) && list.indexOf(model) === index;
});

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

async function generateWithModel(
  model: string,
  apiKey: string,
  parts: Array<Record<string, unknown>>,
): Promise<string | null> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined = setTimeout(
    () => controller.abort(),
    25000,
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
    if (!response.ok) {
      console.error("[Vision API Error]:", {
        model,
        status: response.status,
        body: rawBody.slice(0, 800),
      });
      return null;
    }

    const payload = JSON.parse(rawBody) as GeminiResponse;
    if (payload.error) {
      console.error("[Vision API Error]:", payload.error);
      return null;
    }
    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim();
    return text || null;
  } catch (err) {
    const rec = err && typeof err === "object" ? (err as { name?: unknown; code?: unknown }) : null;
    const blocked = rec?.name === "AbortError" || rec?.code === 20;
    if (blocked) {
      console.error("[Vision API Error]: Network/Firewall Blocked", err);
    } else {
      console.error("[Vision API Error]:", err);
    }
    return null;
  } finally {
    clearAbortTimer();
  }
}

export type GeminiVisionLookup = {
  result: GeminiVisionResult | null;
  rawText: string | null;
};

export async function identifyProductWithGemini(input: {
  productName?: string;
  imageBase64?: string;
  imageMimeType?: string;
  imageName?: string;
  locale: Locale;
}): Promise<GeminiVisionLookup> {
  const empty: GeminiVisionLookup = { result: null, rawText: null };

  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.error("[Vision API Error]:", "GEMINI_API_KEY is not configured");
      return empty;
    }

    const image = normalizeImagePayload(input.imageBase64, input.imageMimeType);
    const textHint = input.productName?.trim() || "";
    if (!image && !textHint) {
      console.error("[Vision API Error]:", "Product name or image is required");
      return empty;
    }

    const locale = input.locale;
    const prompt = `${image ? "Identify the product in this photo" : `Identify this product from the name "${textHint}"`} for Israel import planning.
Return JSON only with:
{
  "productName": "specific consumer product name in locale ${locale}",
  "category": "short category e.g. outdoor/camping textile, vacuum, earbuds",
  "hsCode": "6-digit HS code fitting the item (textiles 63xxxx, electronics 85xxxx — never invent electronics codes for outdoor gear)",
  "estimatedFobUsd": number,
  "estimatedRetailIls": number,
  "customsRatePercent": number,
  "origin": "likely origin country",
  "viabilityNotes": "1-2 sentences in locale ${locale}"
}
estimatedRetailIls must be a single typical/average Israeli shelf price in shekels for this product (not a list of store prices).
Use realistic prices for THAT category (hammock/camping textile FOB often $8–40, Israeli retail often ₪80–350; do not use vacuum/electronics prices).
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

    for (const model of GEMINI_MODELS) {
      const text = await generateWithModel(model, apiKey, parts);
      if (!text) continue;

      const json = extractJsonObject(text);
      const productName =
        typeof json?.productName === "string" ? json.productName.trim() : "";
      if (!productName) {
        return { result: null, rawText: text };
      }

      const fob = asPositiveNumber(json?.estimatedFobUsd);
      const retail = asPositiveNumber(json?.estimatedRetailIls);
      const duty = asPositiveNumber(json?.customsRatePercent);

      return {
        rawText: text,
        result: {
          productName,
          category:
            typeof json?.category === "string" && json.category.trim()
              ? json.category.trim()
              : "General",
          hsCode:
            typeof json?.hsCode === "string" && json.hsCode.trim()
              ? json.hsCode.trim()
              : "",
          estimatedFobUsd: fob ?? 0,
          estimatedRetailIls: retail ?? 0,
          customsRatePercent: duty ?? 0,
          origin:
            typeof json?.origin === "string" && json.origin.trim()
              ? json.origin.trim()
              : locale === "he"
                ? "סין"
                : "China",
          viabilityNotes:
            typeof json?.viabilityNotes === "string"
              ? json.viabilityNotes.trim()
              : "",
        },
      };
    }

    return empty;
  } catch (err) {
    console.error("[Vision API Error]:", err);
    return empty;
  }
}
