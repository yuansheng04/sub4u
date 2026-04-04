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

export async function GET() {
  const userId = await verifySession();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(request: Request) {
  const userId = await verifySession();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { name, amount, currency, cycle, category, startDate, nextBillDate, url, notes, shared } = body;

  if (!name || amount == null || !startDate) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const start = new Date(startDate);
  const computedNext = nextBillDate
    ? new Date(nextBillDate)
    : calcNextBillDate(start, cycle || "monthly");

  const subscription = await prisma.subscription.create({
    data: {
      name,
      amount: Number(amount),
      currency: currency || "CNY",
      cycle: cycle || "monthly",
      category: category || "其他",
      startDate: start,
      nextBillDate: computedNext,
      url: url || null,
      notes: notes || null,
      shared: shared ?? false,
    },
  });

  return NextResponse.json(subscription);
}
