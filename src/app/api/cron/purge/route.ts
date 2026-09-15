import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { broadcastEventSignal } from "@/lib/realtime/events";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expected || !authorization?.startsWith("Bearer ")) return false;
  return timingSafeEqual(digest(authorization.slice(7)), digest(expected));
}

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return json({ code: "UNAUTHORIZED" }, 401);

  const client = createServerClient();
  const { data, error } = await client.rpc("purge_expired_events");
  if (error) return json({ code: "PURGE_FAILED" }, 500);

  const rawIds =
    data && typeof data === "object" && "purgedEventIds" in data
      ? data.purgedEventIds
      : [];
  const purgedEventIds = Array.isArray(rawIds)
    ? rawIds.filter((value): value is string => typeof value === "string")
    : [];
  await Promise.allSettled(
    purgedEventIds.map((eventId) =>
      broadcastEventSignal(client, eventId, "PURGED"),
    ),
  );
  return json({ purgedEventIds }, 200);
}
