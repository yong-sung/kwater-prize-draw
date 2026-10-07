// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/security/display-session", () => ({
  requireDisplaySession: vi.fn().mockResolvedValue({ role: "display" }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ rpc: mocks.rpc }),
}));

describe("POST /api/display/reveal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("현재 경품 코드를 RPC에 전달하고 한 명 공개 결과를 반환한다", async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        status: "REVEALING",
        prizeCode: "KEYBOARD",
        resultId: "result-1",
        groupComplete: false,
      },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/display/reveal", {
        method: "POST",
        body: JSON.stringify({
          eventId: "00000000-0000-4000-8000-000000000001",
          expectedPrizeCode: "KEYBOARD",
        }),
      }),
    );

    expect(mocks.rpc).toHaveBeenCalledWith("reveal_next_in_group", {
      p_event_id: "00000000-0000-4000-8000-000000000001",
      p_expected_prize_code: "KEYBOARD",
    });
    expect(await response.json()).toEqual({
      eventStatus: "REVEALING",
      prizeCode: "KEYBOARD",
      groupComplete: false,
    });
  });
});
