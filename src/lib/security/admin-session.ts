import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const encoder = new TextEncoder();
const MINIMUM_SECRET_BYTES = 32;
export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

export type AdminSession = JWTPayload & {
  role: "admin";
  exp: number;
};

function secretKey(secret: string): Uint8Array {
  const key = encoder.encode(secret);
  if (key.byteLength < MINIMUM_SECRET_BYTES) {
    throw new Error("ADMIN_SESSION_SECRET은 32바이트 이상이어야 합니다");
  }
  return key;
}

export async function createAdminSession(
  secret: string,
  ttlSeconds: number,
): Promise<string> {
  if (!Number.isFinite(ttlSeconds)) {
    throw new Error("세션 만료 시간이 올바르지 않습니다");
  }
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(secretKey(secret));
}

export async function verifyAdminSession(
  token: string,
  secret: string,
): Promise<AdminSession> {
  try {
    const result = await jwtVerify(token, secretKey(secret), {
      algorithms: ["HS256"],
    });
    if (
      result.payload.role !== "admin" ||
      typeof result.payload.exp !== "number"
    ) {
      throw new Error("ADMIN_REQUIRED");
    }
    return result.payload as AdminSession;
  } catch {
    throw new Error("ADMIN_REQUIRED");
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_REQUIRED");
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) throw new Error("ADMIN_REQUIRED");
  return verifyAdminSession(token, secret);
}
