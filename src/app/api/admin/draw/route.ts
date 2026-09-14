import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/security/admin-session";
import { createServerClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
const schema = z.object({ eventId: z.string().uuid() });
const out = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return out({ code: "UNAUTHORIZED" }, 401);
  }
  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await request.json());
  } catch {
    return out({ code: "INVALID_REQUEST" }, 400);
  }
  const client = createServerClient();
  const { data: event, error: qe } = await client
    .from("events")
    .select("status")
    .eq("id", input.eventId)
    .maybeSingle();
  if (qe) return out({ code: "DRAW_FAILED" }, 500);
  if (!event) return out({ code: "EVENT_NOT_FOUND" }, 404);
  if (event.status !== "CLOSED") return out({ code: "EVENT_NOT_CLOSED" }, 409);
  const { data, error } = await client.rpc("execute_draw", {
    p_event_id: input.eventId,
  });
  if (error) {
    const code = /EVENT_NOT_FOUND|EVENT_NOT_CLOSED/.test(error.message)
      ? error.message
      : "DRAW_FAILED";
    return out({ code }, code === "DRAW_FAILED" ? 500 : 409);
  }
  const winnerCount = typeof data === "number" ? data : Number(data);
  if (!Number.isInteger(winnerCount) || winnerCount < 0)
    return out({ code: "DRAW_FAILED" }, 500);
  return out({ winnerCount });
}
