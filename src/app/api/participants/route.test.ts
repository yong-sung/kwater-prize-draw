// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as enterParticipant } from "./route";

const supabaseMocks = vi.hoisted(() => ({
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    from: () => ({
      select: supabaseMocks.select,
      insert: supabaseMocks.insert,
    }),
  }),
}));

function request(body: unknown) {
  return new Request("http://localhost/api/participants", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "홍길동",
  phone: "010-1234-5678",
  department: "디지털관리처",
  privacyConsent: true,
  accessToken: "a".repeat(43),
};

describe("참석자 응모 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PHONE_HASH_SECRET", "dummy-phone-secret-32-bytes-long");
    vi.stubEnv(
      "PARTICIPANT_TOKEN_HASH_SECRET",
      "dummy-token-secret-32-bytes-long",
    );
    vi.stubEnv("PII_ENCRYPTION_KEY", "A".repeat(43) + "=");

    const eventQueryChain = {
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "dummy-event-id", status: "OPEN" },
        error: null,
      }),
    };

    supabaseMocks.select.mockImplementation(() => eventQueryChain);
  });

  it("OPEN 상태이고 유효한 입력이면 201과 participantId만 반환한다", async () => {
    supabaseMocks.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "new-participant-id" },
          error: null,
        }),
      }),
    });

    const response = await enterParticipant(request(validBody));
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual({ participantId: "new-participant-id" });

    // 로그에 PII 원문이 없는지 간접 확인 (mock 호출 인자로 검증)
    const insertCall = supabaseMocks.insert.mock.calls[0][0];
    expect(insertCall.name_ciphertext).not.toContain("홍길동");
    expect(insertCall.phone_ciphertext).not.toContain("010");
  });

  it("동일 전화번호와 동일 토큰 재시도 시 200과 기존 participantId를 반환한다", async () => {
    supabaseMocks.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505", message: "unique constraint violation" }, // Postgres error
        }),
      }),
    });
    const eventQueryChain = {
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "dummy-event-id", status: "OPEN" },
        error: null,
      }),
    };

    const participantQueryChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "existing-participant-id" },
        error: null,
      }),
    };

    supabaseMocks.select.mockImplementation((columns) => {
      if (columns === "id") return participantQueryChain;
      return eventQueryChain;
    });

    const response = await enterParticipant(request(validBody));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      participantId: "existing-participant-id",
    });
  });

  it("동일 전화번호에 다른 토큰으로 접근 시 409 DUPLICATE_PHONE을 반환한다", async () => {
    supabaseMocks.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505", message: "unique constraint violation" },
        }),
      }),
    });
    const eventQueryChain = {
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "dummy-event-id", status: "OPEN" },
        error: null,
      }),
    };

    const participantQueryChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    supabaseMocks.select.mockImplementation((columns) => {
      if (columns === "id") return participantQueryChain;
      return eventQueryChain;
    });

    const response = await enterParticipant(request(validBody));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "DUPLICATE_PHONE",
      error: "이미 응모한 연락처입니다.",
    });
  });

  it("행사가 CLOSED 상태이면 409 EVENT_CLOSED를 반환한다", async () => {
    const eventQueryChain = {
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "dummy-event-id", status: "CLOSED" },
        error: null,
      }),
    };

    supabaseMocks.select.mockImplementation(() => eventQueryChain);

    const response = await enterParticipant(request(validBody));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "EVENT_CLOSED",
      error: "응모가 마감되었습니다.",
    });
  });

  it("privacyConsent가 false이면 400 INVALID_INPUT을 반환한다", async () => {
    const response = await enterParticipant(
      request({ ...validBody, privacyConsent: false }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_INPUT",
      error: "요청을 확인해 주세요.",
    });
  });
});
