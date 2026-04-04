import { NextResponse } from "next/server";
import * as subscriptions from "@/lib/subscriptions";
import { calcNextBillDate } from "@/lib/billing";

export async function GET() {
  return NextResponse.json(await subscriptions.findAll());
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, amount, currency, cycle, category, startDate, nextBillDate, url, notes, shared } = body;

  if (!name || amount == null || !startDate) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const start = new Date(startDate);
  const effectiveCycle = cycle || "monthly";
  const computedNext = nextBillDate
    ? new Date(nextBillDate)
    : calcNextBillDate(start, effectiveCycle);

  const sub = await subscriptions.create({
    name,
    amount: Number(amount),
    currency: currency || "CNY",
    cycle: effectiveCycle,
    category: category || "其他",
    startDate: start.toISOString(),
    nextBillDate: computedNext.toISOString(),
    url: url || null,
    notes: notes || null,
    active: true,
    shared: shared ?? false,
  });

  return NextResponse.json(sub);
}
