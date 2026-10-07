// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  rpc: vi.fn(),
  canResetRehearsal: vi.fn(),
}));

vi.mock("@/lib/security/admin-session", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/rehearsal/reset-guard", () => ({
  canResetRehearsal: mocks.canResetRehearsal,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: mocks.from, rpc: mocks.rpc }),
}));

import { GET, PATCH } from "./route";

describe("관리자 행사 조회 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ role: "admin" });
    mocks.canResetRehearsal.mockReturnValue(true);
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({
      limit: () => ({
        maybeSingle: async () => ({
          data: {
            id: "00000000-0000-4000-8000-000000000001",
            title: "Preview 검증 행사",
            status: "OPEN",
          },
          error: null,
        }),
      }),
    });
  });

  it("events의 id, title, status와 리허설 초기화 가능 여부를 반환한다", async () => {
    const response = await GET();

    expect(mocks.select).toHaveBeenCalledWith("id,title,status");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      event: {
        id: "00000000-0000-4000-8000-000000000001",
        title: "Preview 검증 행사",
        status: "OPEN",
      },
      rehearsalResetAllowed: true,
    });
  });

  it("환경에서 리허설 초기화를 허용하지 않으면 비활성 상태를 반환한다", async () => {
    mocks.canResetRehearsal.mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      rehearsalResetAllowed: false,
    });
  });
});

describe("관리자 행사 상태 전환", () => {
  it("CLOSED에서 OPEN 재개를 DB RPC로 원자 처리한다", async () => {
    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { status: "CLOSED" },
            error: null,
          }),
        }),
      }),
    });
    mocks.rpc.mockResolvedValue({ data: "OPEN", error: null });
    const response = await PATCH(
      new Request("http://localhost/api/admin/event", {
        method: "PATCH",
        body: JSON.stringify({
          eventId: "e1",
          status: "OPEN",
          expectedStatus: "CLOSED",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("transition_event_status", {
      p_event_id: "e1",
      p_expected_status: "CLOSED",
      p_next_status: "OPEN",
    });
  });
});
