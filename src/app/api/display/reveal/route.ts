import { NextResponse } from "next/server";
import { requireDisplaySession } from "@/lib/security/display-session";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RevealResult = {
  status?: string;
  prizeCode?: string | null;
  groupComplete?: boolean;
};

export async function POST(request: Request) {
  try {
    await requireDisplaySession();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (
    typeof body?.eventId !== "string" ||
    ![null, "KEYBOARD", "TUMBLER", "SCANNER"].includes(
      body.expectedPrizeCode ?? null,
    )
  )
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });

  const { data, error } = await createServerClient().rpc(
    "reveal_next_in_group",
    {
      p_event_id: body.eventId,
      p_expected_prize_code: body.expectedPrizeCode ?? null,
    },
  );
  if (error)
    return NextResponse.json({ code: "REVEAL_FAILED" }, { status: 500 });

  const result = (data ?? {}) as RevealResult;
  return NextResponse.json({
    eventStatus: result.status === "REVEALED" ? "REVEALED" : "REVEALING",
    prizeCode: result.prizeCode ?? null,
    groupComplete: result.groupComplete === true,
  });
}
