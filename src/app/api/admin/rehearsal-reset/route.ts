import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-session";
import { canResetRehearsal } from "@/lib/rehearsal/reset-guard";
import { createServerClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!canResetRehearsal(process.env))
    return NextResponse.json(
      { code: "REHEARSAL_RESET_DISABLED" },
      { status: 403 },
    );
  const body = await request.json().catch(() => null);
  if (
    !body?.eventId ||
    typeof body.eventTitle !== "string" ||
    body.confirmation !== "리허설 초기화"
  )
    return NextResponse.json({ code: "INVALID_CONFIRMATION" }, { status: 400 });
  const db = createServerClient();
  const { data: event, error: eventError } = await db
    .from("events")
    .select("id,title,status")
    .eq("id", body.eventId)
    .maybeSingle();
  if (eventError || !event)
    return NextResponse.json({ code: "EVENT_NOT_FOUND" }, { status: 404 });
  if (event.title !== body.eventTitle)
    return NextResponse.json({ code: "EVENT_TITLE_CHANGED" }, { status: 409 });
  const { data, error } = await db.rpc("reset_rehearsal_event", {
    p_event_id: body.eventId,
    p_expected_title: body.eventTitle,
  });
  if (error)
    return NextResponse.json(
      { code: "REHEARSAL_RESET_FAILED" },
      { status: 409 },
    );
  return NextResponse.json(
    { reset: true, result: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
