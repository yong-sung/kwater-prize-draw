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
    const parsed = participantSchema.safeParse(await request.json());
    if (!parsed.success)
      return json(
        { code: "INVALID_INPUT", error: "요청을 확인해 주세요." },
        400,
      );
    const db = createServerClient();
    const { data: event, error: eventError } = await db
      .from("events")
      .select("id,status")
      .neq("status", "PURGED")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (eventError || !event)
      return json(
        { code: "EVENT_NOT_FOUND", error: "행사를 찾을 수 없습니다." },
        404,
      );
    const { name, phone, department, accessToken } = parsed.data;
    const piiKey = process.env.PII_ENCRYPTION_KEY,
      phoneSecret = process.env.PHONE_HASH_SECRET,
      tokenSecret = process.env.PARTICIPANT_TOKEN_HASH_SECRET;
    if (!piiKey || !phoneSecret || !tokenSecret)
      throw new Error("Missing server environment variables");
    const { data, error } = await db.rpc(
      "register_participant" as never,
      {
        p_event_id: event.id,
        p_name_ciphertext: encryptPii(name, piiKey),
        p_phone_ciphertext: encryptPii(phone, piiKey),
        p_department_ciphertext: encryptPii(department, piiKey),
        p_phone_hash: hashPhone(phone, phoneSecret),
        p_access_token_hash: hashAccessToken(accessToken, tokenSecret),
        p_consented_at: new Date().toISOString(),
      } as never,
    );
    if (error) {
      if (/DUPLICATE_PHONE/.test(error.message))
        return json(
          { code: "DUPLICATE_PHONE", error: "이미 응모한 연락처입니다." },
          409,
        );
      if (/EVENT_CLOSED/.test(error.message))
        return json(
          { code: "EVENT_CLOSED", error: "응모가 마감되었습니다." },
          409,
        );
      throw error;
    }
    const result = data as unknown as {
      participantId: string;
      created: boolean;
    };
    return json(
      { participantId: result.participantId },
      result.created ? 201 : 200,
    );
  } catch {
    return json(
      { code: "INTERNAL_ERROR", error: "응모를 처리할 수 없습니다." },
      500,
    );
  }
}
