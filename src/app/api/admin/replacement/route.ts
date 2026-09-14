import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/security/admin-session";
import { createServerClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
const schema = z.object({
  eventId: z.string().uuid(),
  resultId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});
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
  if (qe) return out({ code: "REPLACEMENT_FAILED" }, 500);
  if (!event) return out({ code: "EVENT_NOT_FOUND" }, 404);
  if (event.status === "PUBLISHED")
    return out({ code: "RESULT_ALREADY_PUBLISHED" }, 409);
  if (!["DRAWN", "REVEALING", "REVEALED"].includes(event.status))
    return out({ code: "REPLACEMENT_NOT_ALLOWED" }, 409);
  const { data, error } = await client.rpc("draw_replacement", {
    p_event_id: input.eventId,
    p_result_id: input.resultId,
    p_reason: input.reason,
  });
  if (error) {
    const known = [
      "DRAW_RESULT_NOT_FOUND",
      "REPLACEMENT_NOT_ALLOWED",
      "INVALID_REPLACEMENT_REASON",
      "EVENT_NOT_FOUND",
    ];
    const code =
      known.find((v) => error.message.includes(v)) ?? "REPLACEMENT_FAILED";
    return out({ code }, code === "REPLACEMENT_FAILED" ? 500 : 409);
  }
  if (!data || typeof data !== "object")
    return out({ code: "REPLACEMENT_FAILED" }, 500);
  const value = data as Record<string, unknown>;
  const nested = value.replacement as
    Record<string, unknown> | null | undefined;
  const pid = nested?.participantId ?? value.replacementParticipantId;
  return out({
    replacement: pid
      ? {
          participantId: pid,
          prizeId: nested?.prizeId ?? value.prizeId ?? null,
        }
      : null,
    unawarded: value.unawarded === true || !pid,
  });
}
