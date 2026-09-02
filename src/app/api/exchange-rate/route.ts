import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/exchange-rate";

export const revalidate = 3600;

export async function GET() {
  try {
    const quote = await getExchangeRates();
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json(
      { error: "Failed to load exchange rates" },
      { status: 502 },
    );
  }
}
