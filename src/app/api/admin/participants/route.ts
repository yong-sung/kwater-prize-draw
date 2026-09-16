import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-session";
import { createServerClient } from "@/lib/supabase/server";
import { decryptPii } from "@/lib/security/pii";
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  const { data, error } = await createServerClient()
    .from("participants")
    .select("id,event_id,department_ciphertext,created_at,disqualified_at")
    .limit(500);
  if (error) return NextResponse.json({ code: "LOAD_FAILED" }, { status: 500 });
  const participants = (data ?? []).map((participant) => ({
    id: participant.id,
    event_id: participant.event_id,
    department: decryptPii(
      participant.department_ciphertext,
      process.env.PII_ENCRYPTION_KEY ?? "",
    ),
    created_at: participant.created_at,
    disqualified_at: participant.disqualified_at,
  }));
  return NextResponse.json(
    { participants },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.id || typeof body.disqualified !== "boolean")
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  const { data, error } = await createServerClient()
    .from("participants")
    .update({
      disqualified_at: body.disqualified ? new Date().toISOString() : null,
    })
    .eq("id", body.id)
    .select("id,disqualified_at")
    .maybeSingle();
  if (error)
    return NextResponse.json({ code: "UPDATE_FAILED" }, { status: 500 });
  return NextResponse.json({ participant: data });
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.id)
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  const { error } = await createServerClient()
    .from("participants")
    .update({ disqualified_at: new Date().toISOString() })
    .eq("id", body.id);
  if (error)
    return NextResponse.json({ code: "DELETE_FAILED" }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
