import { NextResponse } from "next/server";
import * as subscriptions from "@/lib/subscriptions";
import { calcNextBillDate } from "@/lib/billing";
import type { Subscription } from "@/lib/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, amount, currency, cycle, category, startDate, nextBillDate, url, notes, active, shared } = body;

  const existing = await subscriptions.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  // If cycle or startDate changed but nextBillDate not explicitly provided, recalculate
  let computedNext: string | undefined;
  if ((cycle !== undefined || startDate !== undefined) && nextBillDate === undefined) {
    const effectiveStart = startDate ? new Date(startDate) : new Date(existing.startDate);
    const effectiveCycle = cycle ?? existing.cycle;
    computedNext = calcNextBillDate(effectiveStart, effectiveCycle).toISOString();
  }

  const patch: Partial<Subscription> = {
    ...(name !== undefined && { name }),
    ...(amount !== undefined && { amount: Number(amount) }),
    ...(currency !== undefined && { currency }),
    ...(cycle !== undefined && { cycle }),
    ...(category !== undefined && { category }),
    ...(startDate !== undefined && { startDate: new Date(startDate).toISOString() }),
    ...(nextBillDate !== undefined
      ? { nextBillDate: nextBillDate ? new Date(nextBillDate).toISOString() : null }
      : computedNext
        ? { nextBillDate: computedNext }
        : {}),
    ...(url !== undefined && { url: url || null }),
    ...(notes !== undefined && { notes: notes || null }),
    ...(active !== undefined && { active }),
    ...(shared !== undefined && { shared }),
  };

  const updated = await subscriptions.update(id, patch);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await subscriptions.remove(id);
  if (!ok) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
