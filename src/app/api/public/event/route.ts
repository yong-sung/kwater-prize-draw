import { NextResponse } from "next/server";
import { decryptPii } from "@/lib/security/pii";
import { createServerClient } from "@/lib/supabase/server";
import {
  PublicEventResponse,
  type PublicRevealGroup,
} from "@/lib/domain/public-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerClient();

  // 행사 정보 조회 (가장 최근 등록된 행사 1건)
  // 실제 상황에서는 status가 PURGED가 아닌 유일한 live 행사가 조회됨
  const { data: event, error } = await supabase
    .from("events")
    .select("*, participants(count)")
    .neq("status", "PURGED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !event) {
    return NextResponse.json(
      { code: "EVENT_NOT_FOUND", error: "활성화된 행사가 없습니다." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const groups: NonNullable<PublicEventResponse["groups"]> = [];
  if (["REVEALING", "REVEALED", "PUBLISHED"].includes(event.status)) {
    const { data: rows, error: resultsError } = await supabase
      .from("draw_results")
      .select(
        "reveal_position,prizes!draw_results_prize_id_fkey(name,code),participants!draw_results_participant_id_fkey(name_ciphertext,department_ciphertext)",
      )
      .eq("event_id", event.id)
      .not("revealed_at", "is", null)
      .order("reveal_position", { ascending: true });
    if (resultsError) {
      return NextResponse.json({ code: "LOAD_FAILED" }, { status: 500 });
    }
    const grouped = new Map<string, PublicRevealGroup>();
    for (const row of rows ?? []) {
      const prize = Array.isArray(row.prizes) ? row.prizes[0] : row.prizes;
      const participant = Array.isArray(row.participants)
        ? row.participants[0]
        : row.participants;
      if (!prize || !participant) continue;
      const group: PublicRevealGroup = grouped.get(prize.code) ?? {
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
      grouped.set(prize.code, group);
    }
    groups.push(...grouped.values());
  }
  const response: PublicEventResponse = {
    id: event.id,
    title: event.title,
    description: event.description,
    venue: event.venue,
    startsAt: event.starts_at,
    status: event.status as PublicEventResponse["status"],
    participantCount: event.participants?.[0]?.count ?? 0,
    privacy: {
      items: event.privacy_items,
      purpose: event.privacy_purpose,
      retentionDays: 7,
    },
    groups,
  };

  return NextResponse.json(response, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
