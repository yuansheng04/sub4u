import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function calcNextBillDate(startDate: Date, cycle: string): Date {
  const now = new Date();
  const next = new Date(startDate);

  while (next <= now) {
    switch (cycle) {
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await verifySession();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, amount, currency, cycle, category, startDate, nextBillDate, url, notes, active, shared } = body;

  // If cycle or startDate changed but nextBillDate not explicitly provided, recalculate
  const existing = await prisma.subscription.findUnique({ where: { id } });
  let computedNext: Date | undefined;
  if (existing && (cycle !== undefined || startDate !== undefined) && nextBillDate === undefined) {
    const effectiveStart = startDate ? new Date(startDate) : existing.startDate;
    const effectiveCycle = cycle ?? existing.cycle;
    computedNext = calcNextBillDate(effectiveStart, effectiveCycle);
  }

  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(currency !== undefined && { currency }),
      ...(cycle !== undefined && { cycle }),
      ...(category !== undefined && { category }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(nextBillDate !== undefined
        ? { nextBillDate: nextBillDate ? new Date(nextBillDate) : null }
        : computedNext
          ? { nextBillDate: computedNext }
          : {}),
      ...(url !== undefined && { url: url || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(active !== undefined && { active }),
      ...(shared !== undefined && { shared }),
    },
  });

  return NextResponse.json(subscription);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await verifySession();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.subscription.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
