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

const id = "00000000-0000-4000-8000-000000000001";
function event(status: string) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: { status }, error: null }),
      }),
    }),
  };
}
function request(eventId = id) {
  return new Request("http://localhost/api/admin/draw", {
    method: "POST",
    body: JSON.stringify({ eventId }),
  });
}

describe("관리자 추첨 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ role: "admin" });
    mocks.from.mockReturnValue(event("CLOSED"));
    mocks.rpc.mockResolvedValue({ data: 3, error: null });
  });

  it("세션이 없으면 401", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("ADMIN_REQUIRED"));
    expect((await POST(request())).status).toBe(401);
  });
  it("OPEN 상태면 409 EVENT_NOT_CLOSED", async () => {
    mocks.from.mockReturnValue(event("OPEN"));
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "EVENT_NOT_CLOSED" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("CLOSED 상태에서 RPC 결과 수만 반환한다", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ winnerCount: 3 });
  });
  it("동시 요청도 RPC 결과 형태를 유지하고 개인정보를 반환하지 않는다", async () => {
    const [first, second] = await Promise.all([
      POST(request()),
      POST(request()),
    ]);
    expect(await first.json()).toEqual({ winnerCount: 3 });
    expect(await second.json()).toEqual({ winnerCount: 3 });
  });
  it("잘못된 UUID는 400", async () => {
    expect((await POST(request("bad-id"))).status).toBe(400);
  });
});
