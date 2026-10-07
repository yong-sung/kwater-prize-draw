import { describe, expect, it, vi } from "vitest";
import {
  checkPreview,
  checkSupabase,
  isExpired,
  EXPIRY,
  REQUIRED_ENV_NAMES,
} from "./preview-availability-check.mjs";
describe("preview availability monitor", () => {
  it("expires after 2026-10-27 rehearsal day", () => {
    expect(EXPIRY).toBe("2026-10-28T00:00:00+09:00");
    expect(isExpired(new Date("2026-10-27T23:59:59+09:00"))).toBe(false);
    expect(isExpired(new Date("2026-10-28T00:00:00+09:00"))).toBe(true);
  });
  it("requires only existing secret names", () =>
    expect(REQUIRED_ENV_NAMES).toEqual([
      "SUPABASE_ACCESS_TOKEN",
      "SUPABASE_PROJECT_ID",
    ]));
  it("checks page phrases and public API with GET only", async () => {
    const calls = [];
    const f = vi.fn(async (u, i = {}) => {
      calls.push(i.method ?? "GET");
      if (String(u).endsWith("/api/public/event"))
        return new Response(
          JSON.stringify({
            id: "6833f277-746c-4033-9aef-30016cbba712",
            status: "OPEN",
          }),
          { status: 200 },
        );
      return new Response(
        String(u).endsWith("/admin") || String(u).endsWith("/display")
          ? "관리자"
          : "경품",
        { status: 200 },
      );
    });
    await expect(checkPreview(f)).resolves.toEqual({ eventStatus: "OPEN" });
    expect(calls.every((m) => m === "GET")).toBe(true);
  });
  it("checks ACTIVE_HEALTHY and read-only endpoint", async () => {
    const f = vi.fn(async (u) => {
      if (String(u).includes("/database/query/read-only"))
        return new Response(
          JSON.stringify([
            { id: "6833f277-746c-4033-9aef-30016cbba712", status: "OPEN" },
          ]),
          { status: 200 },
        );
      return new Response(
        JSON.stringify({
          id: "xmrezoudkgktbtfmzxhu",
          status: "ACTIVE_HEALTHY",
        }),
        { status: 200 },
      );
    });
    await expect(
      checkSupabase(f, {
        SUPABASE_ACCESS_TOKEN: "redacted",
        SUPABASE_PROJECT_ID: "xmrezoudkgktbtfmzxhu",
      }),
    ).resolves.toEqual({
      projectStatus: "ACTIVE_HEALTHY",
      eventStatus: "OPEN",
    });
  });
  it("rejects mismatched project before request", async () => {
    const f = vi.fn();
    await expect(
      checkSupabase(f, {
        SUPABASE_ACCESS_TOKEN: "redacted",
        SUPABASE_PROJECT_ID: "wrong",
      }),
    ).rejects.toThrow(/project ref/);
    expect(f).not.toHaveBeenCalled();
  });
});
