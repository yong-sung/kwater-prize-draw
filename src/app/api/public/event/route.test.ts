// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const from = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from }),
}));

describe("GET /api/public/event", () => {
  it("메타데이터와 상태만 반환하고 공개 당첨자 정보를 조회하지 않는다", async () => {
    const query = {
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "event-1",
          title: "행사",
          description: "설명",
          venue: "강연장",
          starts_at: null,
          status: "PUBLISHED",
          privacy_items: [],
          privacy_purpose: "안내",
          participants: [{ count: 1 }],
        },
        error: null,
      }),
    };
    from.mockReturnValue({ select: vi.fn().mockReturnValue(query) });
    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: "event-1",
      status: "PUBLISHED",
      participantCount: 1,
    });
    expect(body).not.toHaveProperty("groups");
    expect(JSON.stringify(body)).not.toMatch(
      /name|department|phone|ciphertext|token|secret/i,
    );
  });
});
