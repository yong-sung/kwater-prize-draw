// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  decryptPii: vi.fn(),
}));
const decryptedValues: Record<string, string> = {
  "dummy-name-ciphertext": "홍길동",
  "dummy-phone-ciphertext": "01012345678",
  "dummy-department-ciphertext": "디지털협업",
};
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
    mocks.decryptPii.mockImplementation(
      (ciphertext: string) => decryptedValues[ciphertext] ?? "",
    );
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
  it("관리자에게 복호화된 이름·연락처·부서만 반환한다", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(mocks.from().select).toHaveBeenCalledWith(
      "id,event_id,name_ciphertext,phone_ciphertext,department_ciphertext,created_at,disqualified_at",
    );
    expect(mocks.decryptPii).toHaveBeenNthCalledWith(
      1,
      "dummy-name-ciphertext",
      "dummy-key",
    );
    expect(mocks.decryptPii).toHaveBeenNthCalledWith(
      2,
      "dummy-phone-ciphertext",
      "dummy-key",
    );
    expect(mocks.decryptPii).toHaveBeenNthCalledWith(
      3,
      "dummy-department-ciphertext",
      "dummy-key",
    );
    const body = await response.json();
    expect(body).toEqual({
      participants: [
        {
          id: "dummy-participant",
          event_id: "dummy-event",
          name: "홍길동",
          phone: "01012345678",
          department: "디지털협업",
          created_at: "2026-01-01T00:00:00.000Z",
          disqualified_at: null,
        },
      ],
    });
    expect(JSON.stringify(body)).not.toContain("ciphertext");
    expect(JSON.stringify(body)).not.toContain("dummy-name-ciphertext");
    expect(JSON.stringify(body)).not.toContain("dummy-phone-ciphertext");
    expect(JSON.stringify(body)).not.toContain("dummy-department-ciphertext");
    expect(JSON.stringify(body)).not.toContain("access_token");
    expect(JSON.stringify(body)).not.toContain("dummy-key");
  });
});
