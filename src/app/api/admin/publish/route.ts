import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-session";
import { createServerClient } from "@/lib/supabase/server";
import { broadcastEventSignal } from "@/lib/realtime/events";
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.eventId)
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  const db = createServerClient();
  const { data: event } = await db
    .from("events")
    .select("status")
    .eq("id", body.eventId)
    .maybeSingle();
  if (!event)
    return NextResponse.json({ code: "EVENT_NOT_FOUND" }, { status: 404 });
  if (event.status !== "REVEALED" && event.status !== "PUBLISHED")
    return NextResponse.json({ code: "REVEAL_NOT_COMPLETE" }, { status: 409 });
  const { data, error } = await db.rpc("publish_results", {
    p_event_id: body.eventId,
  });
  if (error)
    return NextResponse.json({ code: "PUBLISH_FAILED" }, { status: 500 });
  try {
    await broadcastEventSignal(db, body.eventId, "PUBLISHED");
  } catch {
    // DB 반영은 완료됐다. Realtime 장애 시 polling이 최신 상태를 조회한다.
  }
  return NextResponse.json({ published: true, result: data });
}
