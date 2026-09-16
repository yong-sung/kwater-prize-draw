// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  decryptPii: vi.fn(),
}));
vi.mock("@/lib/security/admin-session", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/security/pii", () => ({ decryptPii: mocks.decryptPii }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: mocks.from }),
}));
describe("GET /api/admin/participants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PII_ENCRYPTION_KEY", "dummy-key");
    mocks.requireAdmin.mockResolvedValue(undefined);
    mocks.decryptPii.mockImplementation(() => "decrypted-department");
    mocks.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: "dummy-participant",
              event_id: "dummy-event",
              department_ciphertext: "dummy-department-ciphertext",
              name_ciphertext: "dummy-name-ciphertext",
              phone_ciphertext: "dummy-phone-ciphertext",
              created_at: "2026-01-01T00:00:00.000Z",
              disqualified_at: null,
            },
          ],
          error: null,
        }),
      }),
    });
  });
  it("department_ciphertext를 조회하고 복호화된 최소 정보만 반환한다", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(mocks.from().select).toHaveBeenCalledWith(
      "id,event_id,department_ciphertext,created_at,disqualified_at",
    );
    expect(mocks.decryptPii).toHaveBeenCalledWith(
      "dummy-department-ciphertext",
      "dummy-key",
    );
    const body = await response.json();
    expect(body).toEqual({
      participants: [
        {
          id: "dummy-participant",
          event_id: "dummy-event",
          department: "decrypted-department",
          created_at: "2026-01-01T00:00:00.000Z",
          disqualified_at: null,
        },
      ],
    });
    expect(JSON.stringify(body)).not.toContain("ciphertext");
    expect(JSON.stringify(body)).not.toContain("dummy-phone");
    expect(JSON.stringify(body)).not.toContain("dummy-key");
  });
});
