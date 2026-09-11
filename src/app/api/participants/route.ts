import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { participantSchema } from "@/lib/domain/validation";
import { encryptPii, hashPhone, hashAccessToken } from "@/lib/security/pii";

export const runtime = "nodejs";

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = participantSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { code: "INVALID_INPUT", error: "요청을 확인해 주세요." },
        400,
      );
    }

    const supabase = createServerClient();

    // 행사 조회 (가장 최근 활성 행사)
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, status")
      .neq("status", "PURGED")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (eventError || !event) {
      return json(
        { code: "EVENT_NOT_FOUND", error: "행사를 찾을 수 없습니다." },
        404,
      );
    }
    if (event.status !== "OPEN") {
      return json(
        { code: "EVENT_CLOSED", error: "응모가 마감되었습니다." },
        409,
      );
    }

    const { name, phone, department, accessToken } = parsed.data;

    const piiKey = process.env.PII_ENCRYPTION_KEY;
    const phoneHashSecret = process.env.PHONE_HASH_SECRET;
    const tokenHashSecret = process.env.PARTICIPANT_TOKEN_HASH_SECRET;

    if (!piiKey || !phoneHashSecret || !tokenHashSecret) {
      throw new Error("Missing server environment variables");
    }

    const phoneHash = hashPhone(phone, phoneHashSecret);
    const tokenHash = hashAccessToken(accessToken, tokenHashSecret);

    const { data: participant, error: insertError } = await supabase
      .from("participants")
      .insert({
        event_id: event.id,
        name_ciphertext: encryptPii(name, piiKey),
        phone_ciphertext: encryptPii(phone, piiKey),
        department_ciphertext: encryptPii(department, piiKey),
        phone_hash: phoneHash,
        access_token_hash: tokenHash,
        consented_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        // unique constraint violation
        // 중복 전화번호/해시
        const { data: existing } = await supabase
          .from("participants")
          .select("id")
          .eq("event_id", event.id)
          .eq("phone_hash", phoneHash)
          .eq("access_token_hash", tokenHash)
          .maybeSingle();

        if (existing) {
          // 동일 전화번호 & 동일 토큰 = 재시도 (멱등성)
          return json({ participantId: existing.id }, 200);
        } else {
          // 동일 전화번호 & 다른 토큰 = 중복 응모 거부
          return json(
            { code: "DUPLICATE_PHONE", error: "이미 응모한 연락처입니다." },
            409,
          );
        }
      }
      throw insertError;
    }

    return json({ participantId: participant.id }, 201);
  } catch {
    return json(
      { code: "INTERNAL_ERROR", error: "응모를 처리할 수 없습니다." },
      500,
    );
  }
}
