import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { PublicEventResponse } from "@/lib/domain/public-event";

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
  };

  return NextResponse.json(response, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
