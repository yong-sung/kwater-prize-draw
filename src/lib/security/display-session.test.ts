import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieGet, jwtVerify } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  jwtVerify: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));
vi.mock("jose", () => ({ jwtVerify }));

import { requireDisplaySession } from "./display-session";

describe("requireDisplaySession", () => {
  beforeEach(() => {
    cookieGet.mockReset();
    jwtVerify.mockReset();
  });

  it("display_session이 없으면 거부한다", async () => {
    cookieGet.mockReturnValue(undefined);
    await expect(requireDisplaySession()).rejects.toThrow("DISPLAY_REQUIRED");
  });

  it("유효한 display role만 허용한다", async () => {
    cookieGet.mockReturnValue({ value: "display-token" });
    jwtVerify.mockResolvedValue({ payload: { role: "display" } });
    process.env.ADMIN_SESSION_SECRET = "a".repeat(32);
    await expect(requireDisplaySession()).resolves.toMatchObject({
      role: "display",
    });
  });

  it.each([
    ["admin role", { role: "admin" }],
    ["만료 토큰", new Error("JWTExpired")],
    ["위조 토큰", new Error("JWSSignatureVerificationFailed")],
  ])("%s은 거부한다", async (_name, result) => {
    cookieGet.mockReturnValue({ value: "invalid-token" });
    if (result instanceof Error) jwtVerify.mockRejectedValue(result);
    else jwtVerify.mockResolvedValue({ payload: result });
    process.env.ADMIN_SESSION_SECRET = "a".repeat(32);
    await expect(requireDisplaySession()).rejects.toThrow();
  });
});
