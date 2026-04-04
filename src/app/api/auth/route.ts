import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export async function POST(request: Request) {
  const { action, username, password } = await request.json();

  if (action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

  if (!username || !password) {
    return NextResponse.json({ error: "缺少用户名或密码" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const success = !!user && (await bcrypt.compare(password, user.password));

  if (!success) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  await createSession(user!.id);
  return NextResponse.json({ ok: true });
}
