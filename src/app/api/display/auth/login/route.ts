import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import {
  createDisplaySession,
  DISPLAY_SESSION_COOKIE,
  DISPLAY_SESSION_TTL_SECONDS,
} from "@/lib/security/display-session";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const password = (await request.json().catch(() => null))?.password;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (
    typeof password !== "string" ||
    !hash ||
    !secret ||
    !(await compare(password, hash))
  )
    return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(
    DISPLAY_SESSION_COOKIE,
    await createDisplaySession(secret),
    {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: DISPLAY_SESSION_TTL_SECONDS,
    },
  );
  return response;
}
