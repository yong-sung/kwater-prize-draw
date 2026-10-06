import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { decryptPii, hashAccessToken } from "@/lib/security/pii";

export const runtime = "nodejs";

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

type Relation<T> = T | T[] | null;

function firstRelation<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ code: "UNAUTHORIZED", error: "접근 권한이 없습니다." }, 401);
  }

  const token = authHeader.substring(7).trim();
  const tokenHashSecret = process.env.PARTICIPANT_TOKEN_HASH_SECRET;
  const piiKey = process.env.PII_ENCRYPTION_KEY;

  if (!tokenHashSecret || !piiKey) {
    return json({ code: "INTERNAL_ERROR", error: "서버 설정 오류" }, 500);
  }

  const supabase = createServerClient();
  const { data: participant, error } = await supabase
    .from("participants")
    .select("id,name_ciphertext,events(status)")
    .eq("access_token_hash", hashAccessToken(token, tokenHashSecret))
    .single();

  if (error || !participant) {
    return json(
      { code: "NOT_FOUND", error: "응모 내역을 찾을 수 없습니다." },
      404,
    );
  }

  const event = firstRelation(participant.events);
  if (!event) {
    return json(
      { code: "EVENT_NOT_FOUND", error: "행사를 찾을 수 없습니다." },
      404,
    );
  }

  if (["DRAWN", "REVEALING", "REVEALED"].includes(event.status)) {
    return json({ state: "WAITING" }, 200);
  }

  if (event.status === "PUBLISHED") {
    const name = decryptPii(participant.name_ciphertext, piiKey);
    const { data: drawResult, error: resultError } = await supabase
      .from("draw_results")
      .select("prizes!draw_results_prize_id_fkey(code,name)")
      .eq("participant_id", participant.id)
      .limit(1)
      .maybeSingle();

    if (resultError) {
      return json(
        { code: "RESULT_LOAD_FAILED", error: "결과를 불러오지 못했습니다." },
        500,
      );
    }

    const prize = firstRelation(drawResult?.prizes ?? null);
    return prize
      ? json(
          {
            state: "WINNER",
            name,
            prizeCode: prize.code,
            prizeName: prize.name,
          },
          200,
        )
      : json({ state: "NOT_WINNER", name }, 200);
  }

  // 응모 토큰이 있는 사용자는 행사 상태와 무관하게 개인 대기 화면을 유지한다.
  return json({ state: "WAITING" }, 200);
}
