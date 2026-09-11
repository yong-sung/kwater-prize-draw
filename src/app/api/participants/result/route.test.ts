// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getResult } from "./route";

const supabaseMocks = vi.hoisted(() => ({
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    from: () => ({
      select: supabaseMocks.select,
    }),
  }),
}));

function request(authHeader: string | null) {
  const headers = new Headers();
  if (authHeader) headers.set("Authorization", authHeader);
  return new Request("http://localhost/api/participants/result", {
    method: "GET",
    headers,
  });
}

describe("개인 결과 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv(
      "PARTICIPANT_TOKEN_HASH_SECRET",
      "dummy-token-secret-32-bytes-long",
    );
    vi.stubEnv("PII_ENCRYPTION_KEY", "A".repeat(43) + "=");
  });

  it("토큰이 없으면 401을 반환한다", async () => {
    const response = await getResult(request(null));
    expect(response.status).toBe(401);
  });

  it("알 수 없는 토큰이면 404를 반환한다", async () => {
    supabaseMocks.select.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" },
        }),
      }),
    });

    const response = await getResult(request("Bearer " + "a".repeat(43)));
    expect(response.status).toBe(404);
  });

  it("행사가 DRAWN 또는 REVEALED 상태이면 WAITING을 반환한다", async () => {
    supabaseMocks.select.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "participant-id",
            events: { status: "REVEALED" },
            name_ciphertext: "encrypted-name",
            draw_results: [],
          },
          error: null,
        }),
      }),
    });

    const response = await getResult(request("Bearer " + "a".repeat(43)));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ state: "WAITING" });
  });

  it("PUBLISHED 상태이고 당첨자이면 WINNER와 상품명을 반환한다", async () => {
    const { encryptPii } = await import("@/lib/security/pii");
    const key = process.env.PII_ENCRYPTION_KEY!;

    supabaseMocks.select.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "participant-id",
            events: { status: "PUBLISHED" },
            name_ciphertext: encryptPii("홍길동", key),
            draw_results: [
              {
                prizes: { name: "스마트 텀블러" },
              },
            ],
          },
          error: null,
        }),
      }),
    });

    const response = await getResult(request("Bearer " + "a".repeat(43)));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      state: "WINNER",
      name: "홍길동",
      prizeName: "스마트 텀블러",
    });
  });

  it("PUBLISHED 상태이고 미당첨자이면 NOT_WINNER를 반환한다", async () => {
    const { encryptPii } = await import("@/lib/security/pii");
    const key = process.env.PII_ENCRYPTION_KEY!;

    supabaseMocks.select.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "participant-id",
            events: { status: "PUBLISHED" },
            name_ciphertext: encryptPii("홍길동", key),
            draw_results: [],
          },
          error: null,
        }),
      }),
    });

    const response = await getResult(request("Bearer " + "a".repeat(43)));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      state: "NOT_WINNER",
      name: "홍길동",
    });
  });
});
