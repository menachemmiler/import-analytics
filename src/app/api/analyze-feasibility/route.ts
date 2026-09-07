import { NextResponse } from "next/server";
import { buildMockFeasibility } from "@/lib/feasibility";
import {
  identifyProductWithGemini,
  normalizeImagePayload,
  type GeminiVisionResult,
} from "@/lib/gemini-vision";
import { buildAnalysis } from "@/lib/mock-data";
import {
  AI_OVERLOADED,
  IMAGE_RECOGNITION_FAILED,
  type FeasibilityApiResponse,
  type FeasibilityRequest,
  type FeasibilitySuccessResponse,
  type ShippingType,
} from "@/lib/fx";
import type { Locale } from "@/lib/types";

function isShippingType(value: unknown): value is ShippingType {
  return value === "air" || value === "sea" || value === "express";
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseRequest(body: unknown): FeasibilityRequest {
  const raw =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const locale: Locale = raw.locale === "en" ? "en" : "he";

  return {
    productName: asString(raw.productName),
    category: asString(raw.category),
    estimatedCost: asNumber(raw.estimatedCost),
    weight: asNumber(raw.weight),
    shippingType: isShippingType(raw.shippingType) ? raw.shippingType : "sea",
    purchaseUsd: asNumber(raw.purchaseUsd, asNumber(raw.estimatedCost)),
    freightUsd: asNumber(raw.freightUsd),
    customsPct: asNumber(raw.customsPct),
    localFeesIls: asNumber(raw.localFeesIls),
    targetRetailIls: asNumber(raw.targetRetailIls),
    usdIls: asNumber(raw.usdIls, 3.7),
    locale,
    imageBase64: asString(raw.imageBase64) || undefined,
    imageMimeType: asString(raw.imageMimeType) || undefined,
    imageName: asString(raw.imageName) || undefined,
    includeDashboard: raw.includeDashboard === true,
  };
}

function recognitionFailed(): NextResponse<FeasibilityApiResponse> {
  return NextResponse.json({
    success: false,
    error: IMAGE_RECOGNITION_FAILED,
  });
}

function aiOverloaded(): NextResponse<FeasibilityApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: AI_OVERLOADED,
    },
    { status: 503 },
  );
}

function attachInsightFields(
  result: FeasibilitySuccessResponse,
): FeasibilitySuccessResponse {
  const board = result.dashboard;
  if (!board) return result;
  return {
    ...result,
    detectedCategory: board.detectedCategory || result.category,
    isLocallyManufactured: board.isLocallyManufactured,
    sourceCountry: board.sourceCountry,
    estimatedRetailRangeIls: board.estimatedRetailRangeIls,
    englishProductName: board.englishProductName,
    localSearch: board.localSearch,
  };
}

function buildVisionAnalysis(
  parsed: FeasibilityRequest,
  locale: Locale,
  vision: GeminiVisionResult,
): FeasibilitySuccessResponse {
  const requestWithVision: FeasibilityRequest = {
    ...parsed,
    productName: vision.productName,
    category: vision.category,
    purchaseUsd:
      vision.estimatedFobUsd > 0 ? vision.estimatedFobUsd : parsed.purchaseUsd,
    targetRetailIls:
      vision.estimatedRetailIls > 0
        ? vision.estimatedRetailIls
        : parsed.targetRetailIls,
    customsPct:
      vision.customsRatePercent > 0
        ? vision.customsRatePercent
        : parsed.customsPct,
  };

  const mock = buildMockFeasibility(requestWithVision);
  const localNote = vision.isLocallyManufactured
    ? locale === "he"
      ? "מוצר זה מיוצר באופן מקומי בישראל. ייבוא עלול להיות פחות כדאי מול ייצור מקומי בגלל הובלה."
      : "This product is commonly manufactured locally in Israel. Import may be less competitive than local production after freight."
    : "";
  const notes = [localNote, vision.viabilityNotes || mock.notes]
    .filter(Boolean)
    .join(" ");

  const result: FeasibilitySuccessResponse = {
    ...mock,
    success: true,
    source: "gemini",
    productName: vision.productName,
    category: vision.detectedCategory || vision.category,
    detectedCategory: vision.detectedCategory,
    isLocallyManufactured: vision.isLocallyManufactured,
    sourceCountry: vision.sourceCountry,
    estimatedRetailRangeIls: vision.estimatedRetailRangeIls,
    englishProductName: vision.englishProductName,
    notes,
    visionSource: "gemini",
  };

  if (parsed.includeDashboard) {
    result.dashboard = {
      ...buildAnalysis(vision.productName, locale, {
        category: vision.detectedCategory || vision.category,
        detectedCategory: vision.detectedCategory,
        detectedCategoryEn: vision.detectedCategoryEn,
        englishProductName: vision.englishProductName,
        hsCode: vision.hsCode,
        estimatedFobUsd: vision.estimatedFobUsd,
        estimatedRetailIls: vision.estimatedRetailIls,
        estimatedRetailIlsMin: vision.estimatedRetailIlsMin,
        estimatedRetailIlsMax: vision.estimatedRetailIlsMax,
        estimatedRetailRangeIls: vision.estimatedRetailRangeIls,
        estimatedSourceRetailIls: vision.estimatedSourceRetailIls,
        estimatedSourceRetailRangeIls: vision.estimatedSourceRetailRangeIls,
        customsRatePercent: vision.customsRatePercent,
        origin: vision.origin,
        sourceCountry: vision.sourceCountry,
        isLocallyManufactured: vision.isLocallyManufactured,
        priceConfidence: vision.priceConfidence,
        imageUrl: null,
      }),
      source: "gemini+mock",
      productName: vision.productName,
      brand: vision.productName.split(/\s+/)[0] ?? vision.productName,
    };
  }

  return attachInsightFields(result);
}

function logFinalAnalysis(result: FeasibilitySuccessResponse) {
  console.log("[Feasibility API] Final Analysis Generated:", {
    detectedProduct: result.productName,
    category: result.category,
    detectedCategory: result.dashboard?.detectedCategory ?? null,
    sourceCountry: result.dashboard?.sourceCountry ?? null,
    isLocallyManufactured: result.dashboard?.isLocallyManufactured ?? false,
    hsCode: result.dashboard?.hsCode ?? null,
    estimatedFobPrice: result.dashboard?.estimatedFobUsd ?? null,
    estimatedRetailIls: result.dashboard?.estimatedRetailRangeIls ?? null,
    englishProductName: result.dashboard?.englishProductName ?? null,
    localSearch: result.dashboard?.localSearch ?? null,
    supplierSearchCount: result.dashboard?.suppliers.length ?? 0,
  });
}

async function analyzeTextQuery(
  parsed: FeasibilityRequest,
  locale: Locale,
  textQuery: string,
): Promise<FeasibilitySuccessResponse | "overloaded"> {
  try {
    const lookup = await identifyProductWithGemini({
      productName: textQuery,
      locale,
    });
    console.log("[Feasibility API] Text Gemini Execution:", {
      detectedProduct: lookup.result?.productName ?? null,
      rawResponse: lookup.rawText,
      overloaded: lookup.overloaded ?? false,
    });
    if (lookup.result) {
      return buildVisionAnalysis(parsed, locale, lookup.result);
    }
    return "overloaded";
  } catch (err) {
    console.error("[Vision API Error]:", err);
    return "overloaded";
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = parseRequest(body);
    const locale: Locale = parsed.locale === "en" ? "en" : "he";
    const textQuery = parsed.productName.trim();
    const imageData = parsed.imageBase64?.trim() ?? "";
    const parsedImage = normalizeImagePayload(imageData, parsed.imageMimeType);
    const hasImage = Boolean(imageData);

    console.log("[Feasibility API] Request received:", {
      hasImage,
      query: textQuery,
    });

    if (hasImage) {
      let visionResult: GeminiVisionResult | null = null;
      let rawText: string | null = null;

      if (parsedImage) {
        try {
          const lookup = await identifyProductWithGemini({
            productName: textQuery,
            imageBase64: parsed.imageBase64,
            imageMimeType: parsed.imageMimeType,
            imageName: parsed.imageName,
            locale,
          });
          visionResult = lookup.result;
          rawText = lookup.rawText;
          console.log("[Feasibility API] Vision Execution:", {
            detectedProduct: visionResult?.productName ?? null,
            rawResponse: rawText,
            overloaded: lookup.overloaded ?? false,
          });
          if (!visionResult && lookup.overloaded) {
            return aiOverloaded();
          }
        } catch (err) {
          console.error("[Vision API Error]:", err);
        }
      } else {
        console.error(
          "[Vision API Error]:",
          "Image payload could not be parsed as base64",
        );
      }

      if (visionResult) {
        const result = buildVisionAnalysis(parsed, locale, visionResult);
        logFinalAnalysis(result);
        return NextResponse.json(result);
      }

      if (textQuery) {
        console.warn(
          "[Feasibility API] Vision failed; falling back to text query:",
          textQuery,
        );
        const result = await analyzeTextQuery(parsed, locale, textQuery);
        if (result === "overloaded") {
          return aiOverloaded();
        }
        logFinalAnalysis(result);
        return NextResponse.json(result);
      }

      return recognitionFailed();
    }

    if (textQuery) {
      const result = await analyzeTextQuery(parsed, locale, textQuery);
      if (result === "overloaded") {
        return aiOverloaded();
      }
      logFinalAnalysis(result);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "QUERY_REQUIRED" }, { status: 400 });
  } catch (err) {
    console.error("[Vision API Error]:", err);
    return NextResponse.json(
      { error: "Failed to analyze import feasibility" },
      { status: 500 },
    );
  }
}
