import { NextResponse } from "next/server";
import { buildMockFeasibility } from "@/lib/feasibility";
import {
  identifyProductWithGemini,
  normalizeImagePayload,
  type GeminiVisionResult,
} from "@/lib/gemini-vision";
import { fetchGoogleSearchLink, googleSearchFallbackUrl } from "@/lib/google-search";
import { buildAnalysis } from "@/lib/mock-data";
import {
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

function buildTextAnalysis(
  parsed: FeasibilityRequest,
  locale: Locale,
  textQuery: string,
): FeasibilitySuccessResponse {
  const request: FeasibilityRequest = {
    ...parsed,
    productName: textQuery,
  };
  const mock = buildMockFeasibility(request);
  const result: FeasibilitySuccessResponse = {
    ...mock,
    success: true,
    source: "mock",
    productName: textQuery,
    visionSource: "heuristic",
  };

  if (parsed.includeDashboard) {
    result.dashboard = buildAnalysis(textQuery, locale, {
      category: parsed.category,
    });
  }

  return result;
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
  const result: FeasibilitySuccessResponse = {
    ...mock,
    success: true,
    source: "gemini",
    productName: vision.productName,
    category: vision.category,
    notes: vision.viabilityNotes || mock.notes,
    visionSource: "gemini",
  };

  if (parsed.includeDashboard) {
    result.dashboard = {
      ...buildAnalysis(vision.productName, locale, {
        category: vision.category,
        hsCode: vision.hsCode,
        estimatedFobUsd: vision.estimatedFobUsd,
        estimatedRetailIls: vision.estimatedRetailIls,
        customsRatePercent: vision.customsRatePercent,
        origin: vision.origin,
      }),
      source: "gemini+mock",
      productName: vision.productName,
      brand: vision.productName.split(/\s+/)[0] ?? vision.productName,
    };
  }

  return result;
}

function supplierSearchQuery(productName: string, supplierName: string): string {
  return `${productName} ${supplierName} site:alibaba.com/product-detail`;
}

function competitorSearchQuery(productName: string, storeName: string): string {
  return `${productName} ${storeName} site:zap.co.il`;
}

async function enrichDirectLink(query: string): Promise<string> {
  try {
    const live = await fetchGoogleSearchLink(query);
    return live ?? googleSearchFallbackUrl(query);
  } catch (err) {
    console.error("[Google Search Error]:", err);
    return googleSearchFallbackUrl(query);
  }
}

async function attachDirectProductUrls(
  result: FeasibilitySuccessResponse,
): Promise<FeasibilitySuccessResponse> {
  if (!result.dashboard) return result;

  const productName = result.productName;
  const [localStores, suppliers] = await Promise.all([
    Promise.all(
      result.dashboard.localStores.map(async (store) => {
        const query = competitorSearchQuery(productName, store.name);
        const directLink = await enrichDirectLink(query);
        return { ...store, directLink, url: directLink };
      }),
    ),
    Promise.all(
      result.dashboard.suppliers.map(async (supplier) => {
        const query = supplierSearchQuery(productName, supplier.name);
        const directLink = await enrichDirectLink(query);
        return { ...supplier, directLink, url: directLink };
      }),
    ),
  ]);

  return {
    ...result,
    dashboard: {
      ...result.dashboard,
      localStores,
      suppliers,
    },
  };
}

function logFinalAnalysis(result: FeasibilitySuccessResponse) {
  console.log("[Feasibility API] Final Analysis Generated:", {
    detectedProduct: result.productName,
    category: result.category,
    hsCode: result.dashboard?.hsCode ?? null,
    estimatedFobPrice: result.dashboard?.estimatedFobUsd ?? null,
    targetStoresCount: result.dashboard?.localStores.length ?? 0,
  });
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
          });
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
        const result = await attachDirectProductUrls(
          buildVisionAnalysis(parsed, locale, visionResult),
        );
        logFinalAnalysis(result);
        return NextResponse.json(result);
      }

      if (textQuery) {
        console.warn(
          "[Feasibility API] Vision failed; falling back to text query:",
          textQuery,
        );
        const result = await attachDirectProductUrls(
          buildTextAnalysis(parsed, locale, textQuery),
        );
        logFinalAnalysis(result);
        return NextResponse.json(result);
      }

      return recognitionFailed();
    }

    if (textQuery) {
      const result = await attachDirectProductUrls(
        buildTextAnalysis(parsed, locale, textQuery),
      );
      logFinalAnalysis(result);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "QUERY_REQUIRED" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[Vision API Error]:", err);
    return NextResponse.json(
      { error: "Failed to analyze import feasibility" },
      { status: 500 },
    );
  }
}
