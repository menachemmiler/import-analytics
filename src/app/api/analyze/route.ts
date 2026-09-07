import { NextResponse } from "next/server";
import { STRICT_ACCURACY_RULE } from "@/lib/ai-accuracy";
import { buildAnalysis } from "@/lib/mock-data";
import type { AnalysisResult, Locale } from "@/lib/types";

type OpenAiEnrichment = Partial<
  Pick<
    AnalysisResult,
    "hsCode" | "origin" | "customsRatePercent" | "estimatedFobUsd"
  >
>;

/**
 * Optional OpenAI overlay. Enabled only when OPENAI_API_KEY is set.
 * Failures fall back to mock data so the dashboard always returns JSON.
 */
async function maybeEnrichWithOpenAI(
  productName: string,
  locale: Locale,
): Promise<OpenAiEnrichment | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `${STRICT_ACCURACY_RULE} You estimate Israel import feasibility. Reply with JSON only: { hsCode, origin, sourceCountry, customsRatePercent, estimatedFobUsd }. Use N/A or null when unknown. Do not invent China as origin.`,
          },
          {
            role: "user",
            content: `Product: ${productName}. Locale: ${locale}.`,
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OpenAiEnrichment;
    return parsed;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      productName?: unknown;
      locale?: unknown;
    };

    const productName =
      typeof body.productName === "string" ? body.productName : "";
    const locale: Locale = body.locale === "en" ? "en" : "he";

    const mock = buildAnalysis(productName, locale);
    const llm = await maybeEnrichWithOpenAI(
      productName || mock.productName,
      locale,
    );

    const data: AnalysisResult = llm
      ? {
          ...mock,
          source: "openai+mock",
          hsCode: typeof llm.hsCode === "string" ? llm.hsCode : mock.hsCode,
          origin: typeof llm.origin === "string" ? llm.origin : mock.origin,
          customsRatePercent:
            typeof llm.customsRatePercent === "number"
              ? llm.customsRatePercent
              : mock.customsRatePercent,
          estimatedFobUsd:
            typeof llm.estimatedFobUsd === "number"
              ? llm.estimatedFobUsd
              : mock.estimatedFobUsd,
          defaults: {
            ...mock.defaults,
            purchaseUsd:
              typeof llm.estimatedFobUsd === "number"
                ? llm.estimatedFobUsd
                : mock.defaults.purchaseUsd,
            customsPct:
              typeof llm.customsRatePercent === "number"
                ? llm.customsRatePercent
                : mock.defaults.customsPct,
          },
        }
      : mock;

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze product" },
      { status: 500 },
    );
  }
}
