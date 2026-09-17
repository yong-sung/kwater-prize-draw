import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
export const DISPLAY_SESSION_COOKIE = "display_session";
export const DISPLAY_SESSION_TTL_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();
const key = (s: string) => {
  if (encoder.encode(s).byteLength < 32)
    throw new Error("DISPLAY_SESSION_SECRET_INVALID");
  return encoder.encode(s);
};
export async function createDisplaySession(secret: string) {
  return new SignJWT({ role: "display" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + DISPLAY_SESSION_TTL_SECONDS,
    )
    .sign(key(secret));
}
export async function requireDisplaySession() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = (await cookies()).get(DISPLAY_SESSION_COOKIE)?.value;
  if (!secret || !token) throw new Error("DISPLAY_REQUIRED");
  const result = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
  if (result.payload.role !== "display") throw new Error("DISPLAY_REQUIRED");
  return result.payload;
}
