// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
const mocks = vi.hoisted(() => ({ select: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    from: () => ({ select: mocks.select }),
    rpc: mocks.rpc,
  }),
}));
const body = {
  name: "가짜참석자",
  phone: "010-1234-5678",
  department: "테스트부",
  privacyConsent: true,
  accessToken: "a".repeat(43),
};
function request(value: unknown = body) {
  return new Request("http://localhost/api/participants", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });
}
describe("참석자 응모 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PHONE_HASH_SECRET", "dummy-phone-secret-32-bytes-long");
    vi.stubEnv(
      "PARTICIPANT_TOKEN_HASH_SECRET",
      "dummy-token-secret-32-bytes-long",
    );
    vi.stubEnv("PII_ENCRYPTION_KEY", "A".repeat(43) + "=");
    mocks.select.mockReturnValue({
      neq: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: async () => ({
              data: { id: "event-1", status: "OPEN" },
              error: null,
            }),
          }),
        }),
      }),
    });
    mocks.rpc.mockResolvedValue({
      data: { participantId: "p-1", created: true },
      error: null,
    });
  });
  it("잠금 기반 register_participant RPC로 응모한다", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "register_participant",
      expect.objectContaining({ p_event_id: "event-1" }),
    );
    expect(await response.json()).toEqual({ participantId: "p-1" });
  });
  it("동일 토큰 재시도는 200이다", async () => {
    mocks.rpc.mockResolvedValue({
      data: { participantId: "p-1", created: false },
      error: null,
    });
    const response = await POST(request());
    expect(response.status).toBe(200);
  });
  it("중복 연락처를 409로 변환한다", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "DUPLICATE_PHONE" },
    });
    const response = await POST(request());
    expect(response.status).toBe(409);
  });
  it("DB가 마감 상태를 감지하면 409로 변환한다", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "EVENT_CLOSED" },
    });
    const response = await POST(request());
    expect(response.status).toBe(409);
  });
  it("동의하지 않으면 RPC 전에 거부한다", async () => {
    const response = await POST(request({ ...body, privacyConsent: false }));
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
