// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/lib/security/admin-session", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: mocks.from, rpc: mocks.rpc }),
}));
import { POST } from "./route";

const eventId = "00000000-0000-4000-8000-000000000001";
const resultId = "00000000-0000-4000-8000-000000000002";
function event(status: string) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: { status }, error: null }),
      }),
    }),
  };
}
function request(reason = "더미 사유") {
  return new Request("http://localhost/api/admin/replacement", {
    method: "POST",
    body: JSON.stringify({ eventId, resultId, reason }),
  });
}

describe("관리자 대체 추첨 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ role: "admin" });
    mocks.from.mockReturnValue(event("DRAWN"));
    mocks.rpc.mockResolvedValue({
      data: {
        replacement: { participantId: "p2", prizeId: "prize-1" },
        unawarded: false,
      },
      error: null,
    });
  });
  it("DRAWN 상태에서 같은 경품의 대체 결과를 반환한다", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      replacement: { participantId: "p2", prizeId: "prize-1" },
      unawarded: false,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("draw_replacement", {
      p_event_id: eventId,
      p_result_id: resultId,
      p_reason: "더미 사유",
    });
  });
  it("빈 사유는 400", async () => {
    expect((await POST(request(""))).status).toBe(400);
  });
  it("PUBLISHED는 409 RESULT_ALREADY_PUBLISHED", async () => {
    mocks.from.mockReturnValue(event("PUBLISHED"));
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      code: "RESULT_ALREADY_PUBLISHED",
    });
  });
  it("후보가 없으면 200 unawarded", async () => {
    mocks.rpc.mockResolvedValue({
      data: { replacement: null, unawarded: true },
      error: null,
    });
    expect(await (await POST(request())).json()).toEqual({
      replacement: null,
      unawarded: true,
    });
  });
});
