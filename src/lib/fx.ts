export const FALLBACK_USD_ILS = 3.7;
export const FALLBACK_EUR_ILS = 4.0;

export type ExchangeRateSource = "live" | "fallback";

export type ExchangeRateQuote = {
  usdIls: number;
  eurIls: number;
  source: ExchangeRateSource;
  fetchedAt: string;
  provider: string;
};

export type ShippingType = "air" | "sea" | "express";

export type FeasibilityRating = "high" | "moderate" | "low" | "unviable";

export type FeasibilityRisk = {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
};

export type FeasibilityAnalysis = {
  source: "gemini" | "ai" | "mock";
  productName: string;
  category: string;
  summary: string;
  profitabilityRating: FeasibilityRating;
  profitabilityScore: number;
  riskFactors: FeasibilityRisk[];
  opportunities: string[];
  recommendedActions: string[];
  estimatedDutyRangePercent: {
    min: number;
    max: number;
  };
  notes: string;
  visionSource: "gemini" | "heuristic";
};

export const IMAGE_RECOGNITION_FAILED = "IMAGE_RECOGNITION_FAILED" as const;
export const AI_OVERLOADED = "AI_OVERLOADED" as const;

export type FeasibilityErrorResponse = {
  success: false;
  error: typeof IMAGE_RECOGNITION_FAILED | typeof AI_OVERLOADED;
};

export type FeasibilitySuccessResponse = FeasibilityAnalysis & {
  success: true;
  detectedCategory?: string;
  isLocallyManufactured?: boolean;
  sourceCountry?: string | null;
  estimatedRetailRangeIls?: string;
  englishProductName?: string;
  localSearch?: string;
  dashboard?: import("@/lib/types").AnalysisResult;
};

export type FeasibilityApiResponse =
  | FeasibilitySuccessResponse
  | FeasibilityErrorResponse;

export type FeasibilityRequest = {
  productName: string;
  category: string;
  estimatedCost: number;
  weight: number;
  shippingType: ShippingType;
  purchaseUsd?: number;
  freightUsd?: number;
  customsPct?: number;
  localFeesIls?: number;
  targetRetailIls?: number;
  usdIls?: number;
  locale?: "he" | "en";
  imageBase64?: string;
  imageMimeType?: string;
  imageName?: string;
  includeDashboard?: boolean;
};
