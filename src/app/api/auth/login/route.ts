import { compare } from "bcryptjs";
import { isIP } from "node:net";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSession,
} from "@/lib/security/admin-session";
import {
  createLoginRateLimiter,
  hashLoginIdentifier,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

function normalizeIp(value: string | null): string | null {
  if (!value) return null;
  let candidate = value.split(",")[0]?.trim().toLowerCase() ?? "";
  if (candidate.startsWith("[") && candidate.includes("]")) {
    candidate = candidate.slice(1, candidate.indexOf("]"));
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(candidate)) {
    candidate = candidate.slice(0, candidate.lastIndexOf(":"));
  }
  if (candidate.startsWith("::ffff:") && isIP(candidate.slice(7)) === 4) {
    candidate = candidate.slice(7);
  }
  return isIP(candidate) ? candidate : null;
}

export function clientIdentifier(request: Request): string {
  const vercelIp = normalizeIp(request.headers.get("x-vercel-forwarded-for"));
  if (process.env.VERCEL) return vercelIp ?? "unknown";
  return (
    vercelIp ??
    normalizeIp(request.headers.get("x-forwarded-for")) ??
    normalizeIp(request.headers.get("x-real-ip")) ??
    "unknown"
  );
}

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let password: unknown;
  try {
    password = (await request.json())?.password;
  } catch {
    return json({ code: "INVALID_INPUT", error: "요청을 확인해 주세요." }, 400);
  }
  if (
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 256
  ) {
    return json(
      { code: "INVALID_INPUT", error: "비밀번호를 입력해 주세요." },
      400,
    );
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  const rateSecret = process.env.LOGIN_RATE_HASH_SECRET;
  if (!passwordHash || !sessionSecret || !rateSecret) {
    return json(
      { code: "AUTH_UNAVAILABLE", error: "로그인할 수 없습니다." },
      503,
    );
  }

  try {
    const ipHash = hashLoginIdentifier(clientIdentifier(request), rateSecret);
    const limiter = createLoginRateLimiter();
    const current = await limiter.check(ipHash);
    if (!current.allowed) {
      return json(
        {
          code: "LOGIN_BLOCKED",
          error: "잠시 후 다시 시도해 주세요.",
          blockedUntil: current.blockedUntil.toISOString(),
        },
        429,
      );
    }

    if (!(await compare(password, passwordHash))) {
      const failure = await limiter.recordFailure(ipHash);
      if (failure.blocked && failure.blockedUntil) {
        return json(
          {
            code: "LOGIN_BLOCKED",
            error: "잠시 후 다시 시도해 주세요.",
            blockedUntil: failure.blockedUntil.toISOString(),
          },
          429,
        );
      }
      return json(
        { code: "INVALID_CREDENTIALS", error: "비밀번호를 확인해 주세요." },
        401,
      );
    }

    await limiter.clear(ipHash);
    const token = await createAdminSession(
      sessionSecret,
      ADMIN_SESSION_TTL_SECONDS,
    );
    const response = json({ ok: true }, 200);
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_TTL_SECONDS,
    });
    return response;
  } catch {
    return json(
      { code: "AUTH_UNAVAILABLE", error: "로그인할 수 없습니다." },
      503,
    );
  }
}
