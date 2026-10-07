import { timingSafeEqual } from "node:crypto";
type ResetEnvironment = Record<string, string | undefined>;
function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
function projectIdFromUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const host = new URL(value).hostname;
    const match = /^([a-z0-9-]+)\.supabase\.co$/i.exec(host);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
export function canResetRehearsal(env: ResetEnvironment): boolean {
  if (env.VERCEL_ENV !== "preview" || env.ALLOW_REHEARSAL_RESET !== "true")
    return false;
  const actual = env.SUPABASE_PROJECT_ID?.trim();
  const allowed = env.REHEARSAL_ALLOWED_SUPABASE_PROJECT_ID?.trim();
  const connected = projectIdFromUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  if (!actual || !allowed || !connected) return false;
  return equal(actual, allowed) && equal(actual, connected);
}
