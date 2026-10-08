import { NextResponse } from "next/server";
import { requireDisplaySession } from "@/lib/security/display-session";
import { decryptPii } from "@/lib/security/pii";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Relation<T> = T | T[] | null;

type RevealedRow = {
  reveal_position: number;
  prizes: Relation<{ code: string; name: string }>;
  participants: Relation<{
    name_ciphertext: string;
    department_ciphertext: string;
  }>;
};

type UpcomingRow = {
  reveal_position: number;
  prizes: Relation<{ code: string; name: string }>;
};

type DisplayWinner = { name: string; department: string };
type DisplayGroup = {
  prizeCode: string;
  prizeName: string;
  winners: DisplayWinner[];
};

const REVEAL_PRIORITY = new Map([
  ["KEYBOARD", 1],
  ["TUMBLER", 2],
  ["SCANNER", 3],
]);

function firstRelation<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function GET() {
  try {
    await requireDisplaySession();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = createServerClient();
  const { data: event, error } = await db
    .from("events")
    .select("*, participants(count)")
    .neq("status", "PURGED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !event)
    return NextResponse.json({ code: "EVENT_NOT_FOUND" }, { status: 404 });

  const groups: DisplayGroup[] = [];
  let nextPrizeName: string | null = null;

  if (event.status === "DRAWN" || event.status === "REVEALING") {
    const { data: upcomingRows, error: upcomingError } = await db
      .from("draw_results")
      .select("reveal_position,prizes!draw_results_prize_id_fkey(code,name)")
      .eq("event_id", event.id)
      .is("revealed_at", null)
      .not("participant_id", "is", null)
      .is("unawarded_at", null)
      .order("reveal_position");
    if (upcomingError)
      return NextResponse.json({ code: "LOAD_FAILED" }, { status: 500 });

    const upcoming = ((upcomingRows ?? []) as UpcomingRow[])
      .flatMap((row) => {
        const prize = firstRelation(row.prizes);
        return prize ? [{ revealPosition: row.reveal_position, prize }] : [];
      })
      .sort((left, right) => {
        const leftOrder =
          REVEAL_PRIORITY.get(left.prize.code) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder =
          REVEAL_PRIORITY.get(right.prize.code) ?? Number.MAX_SAFE_INTEGER;
        return (
          leftOrder - rightOrder || left.revealPosition - right.revealPosition
        );
      });
    nextPrizeName = upcoming[0]?.prize.name ?? null;
  }

  if (["REVEALING", "REVEALED", "PUBLISHED"].includes(event.status)) {
    const { data: rows, error: loadError } = await db
      .from("draw_results")
      .select(
        "reveal_position,prizes!draw_results_prize_id_fkey(name,code),participants!draw_results_participant_id_fkey(name_ciphertext,department_ciphertext)",
      )
      .eq("event_id", event.id)
      .not("revealed_at", "is", null)
      .order("reveal_position");
    if (loadError)
      return NextResponse.json({ code: "LOAD_FAILED" }, { status: 500 });

    const groupsByPrize = new Map<string, DisplayGroup>();
    for (const row of (rows ?? []) as RevealedRow[]) {
      const participant = firstRelation(row.participants);
      const prize = firstRelation(row.prizes);
      if (!participant || !prize) continue;

      const group = groupsByPrize.get(prize.code) ?? {
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
      groupsByPrize.set(prize.code, group);
    }
    groups.push(...groupsByPrize.values());
  }

  return NextResponse.json(
    {
      id: event.id,
      title: event.title,
      description: event.description,
      venue: event.venue,
      startsAt: event.starts_at,
      status: event.status,
      participantCount: event.participants?.[0]?.count ?? 0,
      groups,
      nextPrizeName,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
