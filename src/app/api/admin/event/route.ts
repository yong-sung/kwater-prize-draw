import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-session";
import { createServerClient } from "@/lib/supabase/server";
import { assertTransition } from "@/lib/domain/state-machine";
export const runtime = "nodejs";
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  const db = createServerClient();
  const { data, error } = await db
    .from("events")
    .select("id,title,status")
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ code: "LOAD_FAILED" }, { status: 500 });
  return NextResponse.json(
    { event: data, participants: 0, prizes: 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.eventId)
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  const db = createServerClient();
  const { data: current } = await db
    .from("events")
    .select("status")
    .eq("id", body.eventId)
    .maybeSingle();
  if (!current)
    return NextResponse.json({ code: "EVENT_NOT_FOUND" }, { status: 404 });
  if (body.status) {
    try {
      assertTransition(current.status, body.status);
    } catch {
      return NextResponse.json({ code: "INVALID_TRANSITION" }, { status: 409 });
    }
  }
  const updates = {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    description:
      typeof body.description === "string"
        ? body.description.trim()
        : undefined,
    venue: typeof body.venue === "string" ? body.venue.trim() : undefined,
    status: body.status,
  };
  const { data, error } = await db
    .from("events")
    .update(updates)
    .eq("id", body.eventId)
    .select("id,title,description,venue,status")
    .maybeSingle();
  if (error)
    return NextResponse.json({ code: "UPDATE_FAILED" }, { status: 500 });
  return NextResponse.json({ event: data });
}
