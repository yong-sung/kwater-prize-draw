// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), select: vi.fn() }));
vi.mock("@/lib/security/admin-session", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: () => ({ select: mocks.select }) }),
}));
describe("GET /api/admin/results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(undefined);
    mocks.select.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
  });
  it("uses the explicit prize foreign-key relation", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/admin/results?eventId=dummy-event"),
    );
    expect(response.status).toBe(200);
    expect(mocks.select).toHaveBeenCalledWith(
      "id,participant_id,prize_id,revealed_at,unawarded_at,prizes!draw_results_prize_id_fkey(name,code)",
    );
    expect(await response.json()).toEqual({ results: [] });
  });
});
