// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  broadcast: vi.fn(),
}));
vi.mock("@/lib/security/admin-session", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: mocks.from, rpc: mocks.rpc }),
}));
vi.mock("@/lib/realtime/events", () => ({
  broadcastEventSignal: mocks.broadcast,
}));

import { POST } from "./route";

const eventId = "00000000-0000-4000-8000-000000000010";
const publishedAt = "2026-09-15T01:00:00.000Z";
const purgeAt = "2026-09-22T01:00:00.000Z";
function event(status: string) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: { status }, error: null }),
      }),
    }),
  };
}
function request() {
  return new Request("http://localhost/api/admin/publish", {
    method: "POST",
    body: JSON.stringify({ eventId }),
  });
}

describe("결과 공유 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ role: "admin" });
    mocks.from.mockReturnValue(event("REVEALED"));
    mocks.rpc.mockResolvedValue({
      data: { publishedAt, purgeAt },
      error: null,
    });
    mocks.broadcast.mockResolvedValue(undefined);
  });

  it("REVEALING 상태에서는 409 REVEAL_NOT_COMPLETE를 반환한다", async () => {
    mocks.from.mockReturnValue(event("REVEALING"));
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: "REVEAL_NOT_COMPLETE" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("공유 시 publishedAt과 정확히 7일 뒤 purgeAt을 반환하고 신호를 보낸다", async () => {
    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(
      Date.parse(body.result.purgeAt) - Date.parse(body.result.publishedAt),
    ).toBe(7 * 24 * 60 * 60 * 1_000);
    expect(mocks.broadcast).toHaveBeenCalledWith(
      expect.any(Object),
      eventId,
      "PUBLISHED",
    );
  });

  it("이미 PUBLISHED여도 같은 RPC 결과를 반환해 멱등성을 유지한다", async () => {
    mocks.from.mockReturnValue(event("PUBLISHED"));
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      published: true,
      result: { publishedAt, purgeAt },
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
});
