// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/lib/security/admin-session", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: mocks.from }),
}));

import { GET } from "./route";

describe("관리자 행사 조회 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ role: "admin" });
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

  it("events의 id, title, status를 조회해 반환한다", async () => {
    const response = await GET();

    expect(mocks.select).toHaveBeenCalledWith("id,title,status");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      event: {
        id: "00000000-0000-4000-8000-000000000001",
        title: "Preview 검증 행사",
        status: "OPEN",
      },
    });
  });
});
