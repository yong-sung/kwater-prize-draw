import { NextResponse } from "next/server";
import { requireDisplaySession } from "@/lib/security/display-session";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RevealResult = { status?: string };

export async function POST(request: Request) {
  try {
    await requireDisplaySession();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.eventId !== "string")
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });

  const { data, error } = await createServerClient().rpc("reveal_next", {
    p_event_id: body.eventId,
  });
  if (error)
    return NextResponse.json({ code: "REVEAL_FAILED" }, { status: 500 });

  const result = (data ?? {}) as RevealResult;
  return NextResponse.json({
    eventStatus: result.status === "REVEALED" ? "REVEALED" : "REVEALING",
  });
}
