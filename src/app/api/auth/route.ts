import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { headers } from "next/headers";
import { sendNotification } from "@/lib/notify";

function getClientIp(headersList: Headers): string {
  return (
    headersList.get("x-real-ip") ||
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const { action, username, password } = await request.json();

  if (action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

  const headersList = await headers();
  const ip = getClientIp(headersList);
  const userAgent = headersList.get("user-agent") || undefined;

  if (!username || !password) {
    return NextResponse.json({ error: "缺少用户名或密码" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const success = !!user && (await bcrypt.compare(password, user.password));

  // 记录登录日志
  await prisma.loginLog.create({
    data: { ip, username, success, userAgent },
  });

  // 检查是否为新 IP
  if (success) {
    const previousFromIp = await prisma.loginLog.count({
      where: { ip, success: true, NOT: { id: undefined } },
    });
    // previousFromIp 包含刚插入的这条，所以 === 1 表示首次
    if (previousFromIp <= 1) {
      await sendNotification(
        `🔐 新 IP 登录成功\nIP: ${ip}\n用户: ${username}\n时间: ${new Date().toISOString()}`
      );
    }
  } else {
    await sendNotification(
      `⚠️ 登录失败\nIP: ${ip}\n用户名: ${username}\n时间: ${new Date().toISOString()}`
    );
  }

  if (!success) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  await createSession(user!.id);
  return NextResponse.json({ ok: true });
}
