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

  const tokenHash = hashAccessToken(token, tokenHashSecret);
  const supabase = createServerClient();

  const { data: participant, error } = await supabase
    .from("participants")
    .select(
      `
      id, 
      name_ciphertext,
      events ( status ),
      draw_results ( prizes ( name ) )
    `,
    )
    .eq("access_token_hash", tokenHash)
    .single();

  if (error || !participant) {
    return json(
      { code: "NOT_FOUND", error: "응모 내역을 찾을 수 없습니다." },
      404,
    );
  }

  const event = Array.isArray(participant.events)
    ? participant.events[0]
    : participant.events;
  const eventStatus = event?.status;

  if (
    eventStatus === "DRAWN" ||
    eventStatus === "REVEALING" ||
    eventStatus === "REVEALED"
  ) {
    return json({ state: "WAITING" }, 200);
  }

  if (eventStatus === "PUBLISHED") {
    const name = decryptPii(participant.name_ciphertext, piiKey);
    const hasPrize =
      participant.draw_results &&
      (Array.isArray(participant.draw_results)
        ? participant.draw_results.length > 0
        : true);

    if (hasPrize) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const drawResult = Array.isArray(participant.draw_results) ? participant.draw_results[0] : (participant.draw_results as any);
      const prize = Array.isArray(drawResult?.prizes)
        ? drawResult.prizes[0]
        : drawResult?.prizes;
      const prizeName = prize?.name;
      return json({ state: "WINNER", name, prizeName }, 200);
    } else {
      return json({ state: "NOT_WINNER", name }, 200);
    }
  }

  // 그 외 상태 (SETUP, OPEN, CLOSED)
  return json({ state: "WAITING" }, 200);
}
