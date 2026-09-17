// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  decryptPii: vi.fn(),
}));

vi.mock("@/lib/security/admin-session", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/security/pii", () => ({ decryptPii: mocks.decryptPii }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ rpc: mocks.rpc, from: mocks.from }),
}));

describe("POST /api/admin/reveal", () => {
  it("returns only decrypted names and departments for revealed winners", async () => {
    vi.stubEnv("PII_ENCRYPTION_KEY", "dummy-encryption-key");
    mocks.requireAdmin.mockResolvedValue(undefined);
    mocks.rpc.mockResolvedValue({ data: { status: "REVEALING" }, error: null });
    mocks.decryptPii.mockImplementation((value: string) =>
      value === "dummy-name-value" ? "홍길동" : "물관리부",
    );
    const not = vi.fn().mockResolvedValue({
      data: [
        {
          prizes: { code: "TUMBLER", name: "텀블러" },
          participants: {
            name_ciphertext: "dummy-name-value",
            department_ciphertext: "dummy-department-value",
          },
        },
      ],
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ not });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId: "dummy-event" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(select).toHaveBeenCalledWith(
      "revealed_at,prizes!draw_results_prize_id_fkey(code,name),participants!draw_results_participant_id_fkey(name_ciphertext,department_ciphertext)",
    );
    expect(eq).toHaveBeenCalledWith("event_id", "dummy-event");
    expect(not).toHaveBeenCalledWith("revealed_at", "is", null);
    const body = await response.json();
    expect(body).toMatchObject({
      eventStatus: "REVEALING",
      groups: [
        {
          prizeCode: "TUMBLER",
          prizeName: "텀블러",
          winners: [{ name: "홍길동", department: "물관리부" }],
        },
      ],
    });
    expect(JSON.stringify(body)).not.toMatch(
      /ciphertext|phone|dummy-encryption-key|dummy-name-value|dummy-department-value/i,
    );
  });
});
