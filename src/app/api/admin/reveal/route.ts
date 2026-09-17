import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-session";
import { decryptPii } from "@/lib/security/pii";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Relation<T> = T | T[] | null;

type RevealedRow = {
  prizes: Relation<{ code: string; name: string }>;
  participants: Relation<{
    name_ciphertext: string;
    department_ciphertext: string;
  }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

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

  const { data: revealedRows, error: revealedError } = await supabase
    .from("draw_results")
    .select(
      "revealed_at,prizes!draw_results_prize_id_fkey(code,name),participants!draw_results_participant_id_fkey(name_ciphertext,department_ciphertext)",
    )
    .eq("event_id", body.eventId)
    .not("revealed_at", "is", null);
  if (revealedError)
    return NextResponse.json({ code: "REVEAL_FAILED" }, { status: 500 });

  const groups = new Map<
    string,
    {
      prizeCode: string;
      prizeName: string;
      winners: Array<{ name: string; department: string }>;
    }
  >();
  for (const row of (revealedRows ?? []) as RevealedRow[]) {
    const prize = firstRelation(row.prizes);
    const participant = firstRelation(row.participants);
    if (!prize || !participant) continue;
    const group = groups.get(prize.code) ?? {
      prizeCode: prize.code,
      prizeName: prize.name,
      winners: [],
    };
    group.winners.push({
      name: decryptPii(
        participant.name_ciphertext,
        process.env.PII_ENCRYPTION_KEY ?? "",
      ),
      department: decryptPii(
        participant.department_ciphertext,
        process.env.PII_ENCRYPTION_KEY ?? "",
      ),
    });
    groups.set(prize.code, group);
  }

  const result = (data ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    eventStatus: result.status === "REVEALED" ? "REVEALED" : "REVEALING",
    prizeCode: result.prizeCode ?? result.prize_code ?? null,
    prizeName: result.prizeName ?? result.prize_name ?? null,
    revealedWinner: result.revealedWinner ?? result.revealed_winner ?? null,
    groups: [...groups.values()],
  });
}
