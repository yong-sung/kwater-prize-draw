// @vitest-environment node

import { compare } from "bcryptjs";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

const rateMocks = vi.hoisted(() => ({
  check: vi.fn(),
  recordFailure: vi.fn(),
  clear: vi.fn(),
  hashLoginIdentifier: vi.fn(() => "dummy-ip-hmac"),
}));

vi.mock("bcryptjs", () => ({ compare: vi.fn() }));
vi.mock("@/lib/security/rate-limit", () => ({
  createLoginRateLimiter: () => rateMocks,
  hashLoginIdentifier: rateMocks.hashLoginIdentifier,
}));

import { clientIdentifier, POST as login } from "./route";
import { POST as logout } from "../logout/route";

const mockedCompare = compare as unknown as Mock<
  (password: string, hash: string) => Promise<boolean>
>;

function request(password: unknown = "dummy-password") {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.0.2.10",
    },
    body: JSON.stringify({ password }),
  });
}

describe("관리자 인증 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ADMIN_PASSWORD_HASH", "$2b$12$dummy.hash.for.tests.only");
    vi.stubEnv(
      "ADMIN_SESSION_SECRET",
      "dummy-admin-session-secret-32-bytes-long",
    );
    vi.stubEnv("LOGIN_RATE_HASH_SECRET", "dummy-rate-secret-32-bytes-long");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL", "");
    rateMocks.check.mockResolvedValue({ allowed: true });
    rateMocks.recordFailure.mockResolvedValue({ blocked: false });
    rateMocks.clear.mockResolvedValue(undefined);
  });

  it("정확한 비밀번호에 8시간 HttpOnly 관리자 쿠키를 발급한다", async () => {
    mockedCompare.mockResolvedValue(true);
    const response = await login(request());

    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("admin_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=strict");
    expect(cookie).toContain("Max-Age=28800");
    expect(rateMocks.clear).toHaveBeenCalledWith("dummy-ip-hmac");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("틀린 비밀번호는 401이며 실패를 기록하고 쿠키를 발급하지 않는다", async () => {
    mockedCompare.mockResolvedValue(false);
    const response = await login(request("wrong-dummy-password"));

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(rateMocks.recordFailure).toHaveBeenCalledWith("dummy-ip-hmac");
  });

  it("차단 중이면 비밀번호를 비교하지 않고 429와 blockedUntil을 반환한다", async () => {
    const blockedUntil = new Date("2026-09-11T00:15:00.000Z");
    rateMocks.check.mockResolvedValue({ allowed: false, blockedUntil });
    const response = await login(request());

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      code: "LOGIN_BLOCKED",
      blockedUntil: blockedUntil.toISOString(),
    });
    expect(mockedCompare).not.toHaveBeenCalled();
  });

  it("잘못된 입력을 안전하게 거부한다", async () => {
    const response = await login(request(""));
    expect(response.status).toBe(400);
    expect(mockedCompare).not.toHaveBeenCalled();
  });

  it("로그아웃은 관리자 쿠키를 즉시 만료한다", async () => {
    const response = await logout();
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("admin_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });

  it("production 쿠키에는 Secure를 적용한다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockedCompare.mockResolvedValue(true);

    const loginResponse = await login(request());
    const logoutResponse = await logout();
    expect(loginResponse.headers.get("set-cookie")).toContain("Secure");
    expect(logoutResponse.headers.get("set-cookie")).toContain("Secure");
  });

  it("Vercel에서는 변조 가능한 전달 헤더보다 Vercel IP를 우선한다", () => {
    vi.stubEnv("VERCEL", "1");
    const incoming = new Request("https://example.test", {
      headers: {
        "x-vercel-forwarded-for": "2001:db8::1",
        "x-forwarded-for": "192.0.2.99",
      },
    });
    expect(clientIdentifier(incoming)).toBe("2001:db8::1");
  });

  it("IP 주소를 정규화하고 Vercel의 잘못된 주소는 unknown으로 제한한다", () => {
    expect(
      clientIdentifier(
        new Request("http://localhost", {
          headers: { "x-forwarded-for": "::ffff:192.0.2.10, 198.51.100.1" },
        }),
      ),
    ).toBe("192.0.2.10");
    vi.stubEnv("VERCEL", "1");
    expect(
      clientIdentifier(
        new Request("https://example.test", {
          headers: { "x-vercel-forwarded-for": "not-an-ip" },
        }),
      ),
    ).toBe("unknown");
  });
});
