import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-session";
import { createServerClient } from "@/lib/supabase/server";
import { decryptPii } from "@/lib/security/pii";
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  const eventId = new URL(request.url).searchParams.get("eventId");
  if (!eventId)
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  const { data, error } = await createServerClient()
    .from("draw_results")
    .select(
      "id,participant_id,prize_id,revealed_at,unawarded_at,prizes!draw_results_prize_id_fkey(name,code),participants!draw_results_participant_id_fkey(name_ciphertext,department_ciphertext)",
    )
    .eq("event_id", eventId);
  if (error) return NextResponse.json({ code: "LOAD_FAILED" }, { status: 500 });
  return NextResponse.json({
    results: (data ?? []).map((r) => {
      const participant = Array.isArray(r.participants)
        ? r.participants[0]
        : r.participants;
      return {
        id: r.id,
        participantId: r.participant_id,
        winner: participant
          ? {
              name: decryptPii(
                participant.name_ciphertext,
                process.env.PII_ENCRYPTION_KEY ?? "",
              ),
              department: decryptPii(
                participant.department_ciphertext,
                process.env.PII_ENCRYPTION_KEY ?? "",
              ),
            }
          : null,
        prize: r.prizes,
        revealed: Boolean(r.revealed_at),
        unawarded: Boolean(r.unawarded_at),
      };
    }),
  });
}
