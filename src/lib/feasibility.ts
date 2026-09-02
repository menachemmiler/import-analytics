import { landedCost, type CalcInputs } from "@/lib/landed-cost";
import type {
  FeasibilityAnalysis,
  FeasibilityRating,
  FeasibilityRequest,
  FeasibilityRisk,
  ShippingType,
} from "@/lib/fx";
import type { Locale } from "@/lib/types";

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ratingFromScore(score: number): FeasibilityRating {
  if (score >= 75) return "high";
  if (score >= 50) return "moderate";
  if (score >= 30) return "low";
  return "unviable";
}

function shippingRisk(
  shippingType: ShippingType,
  weight: number,
  locale: Locale,
): FeasibilityRisk {
  if (shippingType === "air" && weight > 20) {
    return {
      title: locale === "he" ? "הובלה אווירית כבדה" : "Heavy air freight",
      detail:
        locale === "he"
          ? "משקל גבוה באוויר מייקר את עלות הנחיתה ומכרסם במרווח."
          : "High weight on air freight inflates landed cost and compresses margin.",
      severity: "high",
    };
  }
  if (shippingType === "express") {
    return {
      title: locale === "he" ? "שילוח אקספרס" : "Express shipping",
      detail:
        locale === "he"
          ? "מתאים לדגימות, אך יקר למלאי מסחרי."
          : "Suitable for samples, expensive for commercial inventory.",
      severity: "medium",
    };
  }
  return {
    title: locale === "he" ? "הובלה ימית" : "Ocean freight",
    detail:
      locale === "he"
        ? "עלות נמוכה יותר אך זמני אספקה ארוכים יותר."
        : "Lower unit cost with longer lead times.",
    severity: "low",
  };
}

export function buildMockFeasibility(
  request: FeasibilityRequest,
): FeasibilityAnalysis {
  const locale: Locale = request.locale === "en" ? "en" : "he";
  const productName = request.productName.trim() || (locale === "he" ? "מוצר ללא שם" : "Unnamed product");
  const category =
    request.category.trim() || (locale === "he" ? "כללי" : "General");

  const inputs: CalcInputs = {
    purchaseUsd: request.purchaseUsd ?? request.estimatedCost,
    freightUsd: request.freightUsd ?? 0,
    customsPct: request.customsPct ?? 0,
    localFeesIls: request.localFeesIls ?? 0,
    targetRetailIls: request.targetRetailIls ?? 0,
    usdIls: request.usdIls ?? 3.7,
  };
  const result = landedCost(inputs);

  let score = 40 + result.margin * 1.4;
  if (request.shippingType === "air") score -= request.weight > 15 ? 18 : 8;
  if (request.shippingType === "express") score -= 12;
  if (request.weight > 40) score -= 10;
  if (inputs.customsPct > 12) score -= 10;
  score = clampScore(score);
  const profitabilityRating = ratingFromScore(score);

  const riskFactors: FeasibilityRisk[] = [
    shippingRisk(request.shippingType, request.weight, locale),
  ];

  if (result.margin < 10) {
    riskFactors.push({
      title: locale === "he" ? "מרווח נמוך" : "Thin margin",
      detail:
        locale === "he"
          ? "המחיר הקמעונאי היעד כמעט אינו מכסה עלות נחיתה, מע\"מ ומרווח הפצה."
          : "Target retail barely covers landed cost, VAT, and distribution margin.",
      severity: "high",
    });
  }

  if (inputs.customsPct >= 8) {
    riskFactors.push({
      title: locale === "he" ? "חשיפת מכס" : "Duty exposure",
      detail:
        locale === "he"
          ? `שיעור המכס במחשבון הוא ${inputs.customsPct}%. אמתו סיווג HS לפני הזמנה.`
          : `Calculator duty is ${inputs.customsPct}%. Confirm HS classification before ordering.`,
      severity: "medium",
    });
  }

  const opportunities =
    locale === "he"
      ? [
          "השוו FOB מול לפחות שני ספקים מאומתים לפני התחייבות ל-MOQ.",
          "בדקו ערוץ אונליין בישראל מול רשתות — פערי מחיר עשויים לשפר כדאיות.",
        ]
      : [
          "Compare FOB quotes from at least two verified suppliers before locking MOQ.",
          "Check Israeli online channels versus retail chains - price gaps can lift feasibility.",
        ];

  const recommendedActions =
    locale === "he"
      ? [
          "אמתו קוד HS ועם עמיל מכס לפני שילוח.",
          "חשבו מחדש עם שער USD/ILS חי ומכס מעודכן.",
          "התחילו במשלוח דגימה לפני הזמנה מלאה.",
        ]
      : [
          "Confirm HS code with a licensed customs broker before shipping.",
          "Recalculate with a live USD/ILS rate and current duty.",
          "Start with a sample shipment before a full order.",
        ];

  const summary =
    locale === "he"
      ? `ניתוח הדגמה עבור ${productName} (${category}): ציון כדאיות ${score}/100, דירוג ${profitabilityRating}. מרווח מחושב ${result.margin.toFixed(1)}%.`
      : `Mock analysis for ${productName} (${category}): feasibility score ${score}/100 (${profitabilityRating}). Calculated margin ${result.margin.toFixed(1)}%.`;

  return {
    source: "mock",
    productName,
    category,
    summary,
    profitabilityRating,
    profitabilityScore: score,
    riskFactors,
    opportunities,
    recommendedActions,
    estimatedDutyRangePercent: {
      min: Math.max(0, Number((inputs.customsPct - 2).toFixed(1))),
      max: Number((inputs.customsPct + 4).toFixed(1)),
    },
    notes:
      locale === "he"
        ? "תשובת הדגמה (אין מפתח AI או מצב פיתוח). אינה ייעוץ מכס או השקעה."
        : "Mock response (no AI key or development mode). Not customs or investment advice.",
    visionSource: "heuristic",
  };
}
