import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("bcryptjs", () => ({ compare: vi.fn() }));
vi.mock("@/lib/security/display-session", () => ({
  createDisplaySession: vi.fn().mockResolvedValue("display-token"),
  DISPLAY_SESSION_COOKIE: "display_session",
  DISPLAY_SESSION_TTL_SECONDS: 28800,
}));
import { compare } from "bcryptjs";
import { POST } from "./route";

describe("display 로그인 쿠키 동작 계약", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD_HASH = "hash";
    process.env.ADMIN_SESSION_SECRET = "a".repeat(32);
    vi.mocked(compare).mockResolvedValue(true as never);
  });
  it("성공 시 display 전용 보안 쿠키를 발급한다", async () => {
    const response = await POST(
      new Request("http://localhost/api/display/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: "ok" }),
      }),
    );
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(response.status).toBe(200);
    expect(cookie).toContain("display_session=");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("secure");
    expect(cookie.toLowerCase()).toContain("samesite=strict");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=28800");
    expect(cookie).not.toContain("admin_session=");
  });
  it("잘못된 비밀번호는 display 세션 쿠키를 발급하지 않는다", async () => {
    vi.mocked(compare).mockResolvedValue(false as never);
    const response = await POST(
      new Request("http://localhost/api/display/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: "bad" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
