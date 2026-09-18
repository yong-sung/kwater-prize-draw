import { NextResponse } from "next/server";
import { requireDisplaySession } from "@/lib/security/display-session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireDisplaySession();
    if (session?.role !== "display") throw new Error("DISPLAY_REQUIRED");
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
