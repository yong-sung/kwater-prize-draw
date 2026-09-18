import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireDisplaySession } = vi.hoisted(() => ({
  requireDisplaySession: vi.fn(),
}));
vi.mock("@/lib/security/display-session", () => ({
  requireDisplaySession,
}));

import { GET } from "./route";

describe("GET /api/display/auth/session", () => {
  beforeEach(() => requireDisplaySession.mockReset());

  it("유효한 display 세션이면 인증 상태만 반환한다", async () => {
    requireDisplaySession.mockResolvedValue({ role: "display" });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: true });
  });

  it("세션이 없거나 유효하지 않으면 인증 실패 상태만 반환한다", async () => {
    requireDisplaySession.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: false });
  });
});
