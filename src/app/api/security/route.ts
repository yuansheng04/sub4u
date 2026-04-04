import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const userId = await verifySession();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const logs = await prisma.loginLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // 统计每个 IP 的首次成功登录时间
  const knownIps = new Set<string>();
  const sortedByOldest = [...logs].reverse();
  for (const log of sortedByOldest) {
    if (log.success) knownIps.add(log.ip);
  }

  return NextResponse.json({ logs, knownIps: Array.from(knownIps) });
}
