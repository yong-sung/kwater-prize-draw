// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  decryptPii: vi.fn((value: string) =>
    value === "name-cipher" ? "홍길동" : "개발팀",
  ),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: mocks.from }),
}));
vi.mock("@/lib/security/pii", () => ({ decryptPii: mocks.decryptPii }));

describe("GET /api/public/event", () => {
  it("PUBLISHED 행사에서 공개된 결과만 최소 필드로 반환한다", async () => {
    const eventQuery = {
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "event-1",
          title: "행사",
          description: "설명",
          venue: "강당",
          starts_at: null,
          status: "PUBLISHED",
          privacy_items: ["성명"],
          privacy_purpose: "추첨",
          participants: [{ count: 1 }],
        },
        error: null,
      }),
    };
    const resultQuery = {
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            reveal_position: 1,
            prizes: { name: "텀블러", code: "TUMBLER" },
            participants: {
              name_ciphertext: "name-cipher",
              department_ciphertext: "department-cipher",
              phone_ciphertext: "phone-cipher",
            },
          },
          {
            reveal_position: 2,
            prizes: { name: "노트", code: "NOTE" },
            participants: null,
          },
        ],
        error: null,
      }),
    };
    const eventSelect = vi.fn().mockReturnValue(eventQuery);
    const resultSelect = vi.fn().mockReturnValue(resultQuery);
    mocks.from
      .mockReturnValueOnce({ select: eventSelect })
      .mockReturnValueOnce({ select: resultSelect });
    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(resultQuery.not).toHaveBeenCalledWith("revealed_at", "is", null);
    expect(resultSelect).toHaveBeenCalledWith(
      "reveal_position,prizes!draw_results_prize_id_fkey(name,code),participants!draw_results_participant_id_fkey(name_ciphertext,department_ciphertext)",
    );
    expect(body.groups).toEqual([
      {
        prizeCode: "TUMBLER",
        prizeName: "텀블러",
        winners: [{ name: "홍길동", department: "개발팀" }],
      },
    ]);
    expect(JSON.stringify(body)).not.toMatch(
      /cipher|phone|name-cipher|department-cipher|phone-cipher/i,
    );
  });
});
