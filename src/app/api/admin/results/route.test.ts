// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  select: vi.fn(),
  decryptPii: vi.fn(),
}));

vi.mock("@/lib/security/admin-session", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: () => ({ select: mocks.select }) }),
}));
vi.mock("@/lib/security/pii", () => ({ decryptPii: mocks.decryptPii }));

describe("GET /api/admin/results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PII_ENCRYPTION_KEY", "dummy-encryption-key");
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
      "id,participant_id,prize_id,revealed_at,unawarded_at,prizes!draw_results_prize_id_fkey(name,code),participants!draw_results_participant_id_fkey(name_ciphertext,department_ciphertext)",
    );
    expect(await response.json()).toEqual({ results: [] });
  });

  it("decrypts and returns only the winner name and department", async () => {
    mocks.decryptPii.mockImplementation((value: string) =>
      value === "dummy-name-value" ? "홍길동" : "물관리부",
    );
    mocks.select.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            id: "dummy-result",
            participant_id: "dummy-participant",
            prize_id: "dummy-prize",
            revealed_at: null,
            unawarded_at: null,
            prizes: { name: "텀블러", code: "TUMBLER" },
            participants: {
              name_ciphertext: "dummy-name-value",
              department_ciphertext: "dummy-department-value",
            },
          },
        ],
        error: null,
      }),
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/admin/results?eventId=dummy-event"),
    );

    expect(mocks.decryptPii).toHaveBeenNthCalledWith(
      1,
      "dummy-name-value",
      "dummy-encryption-key",
    );
    expect(mocks.decryptPii).toHaveBeenNthCalledWith(
      2,
      "dummy-department-value",
      "dummy-encryption-key",
    );
    const body = await response.json();
    expect(body.results[0]).toMatchObject({
      winner: { name: "홍길동", department: "물관리부" },
      prize: { name: "텀블러", code: "TUMBLER" },
    });
    expect(JSON.stringify(body)).not.toMatch(
      /ciphertext|phone|dummy-encryption-key|dummy-name-value|dummy-department-value/i,
    );
  });
});
