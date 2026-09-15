import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-session";
import { createServerClient } from "@/lib/supabase/server";
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
  if (event.status !== "REVEALED")
    return NextResponse.json({ code: "RESULT_NOT_READY" }, { status: 409 });
  const { data, error } = await db.rpc("publish_results", {
    p_event_id: body.eventId,
  });
  if (error)
    return NextResponse.json({ code: "PUBLISH_FAILED" }, { status: 500 });
  return NextResponse.json({ published: true, result: data });
}
