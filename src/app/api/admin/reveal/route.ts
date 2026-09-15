import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-session";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.eventId !== "string")
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("reveal_next", {
    p_event_id: body.eventId,
  });
  if (error)
    return NextResponse.json({ code: "REVEAL_FAILED" }, { status: 500 });
  const result = (data ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    eventStatus: result.status === "REVEALED" ? "REVEALED" : "REVEALING",
    prizeCode: result.prizeCode ?? result.prize_code ?? null,
    prizeName: result.prizeName ?? result.prize_name ?? null,
    revealedWinner: result.revealedWinner ?? result.revealed_winner ?? null,
    groups: Array.isArray(result.groups) ? result.groups : [],
  });
}
