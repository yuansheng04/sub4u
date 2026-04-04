import { NextResponse } from "next/server";

// Static stub rates, base = USD. Replace with live fetch later.
const STUB_RATES: Record<string, number> = {
  USD: 1,
  CNY: 7.2,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150,
  HKD: 7.8,
  KRW: 1350,
  SGD: 1.35,
  CAD: 1.36,
  AUD: 1.52,
};

export async function GET() {
  return NextResponse.json({ rates: STUB_RATES });
}
