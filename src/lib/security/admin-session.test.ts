// @vitest-environment node

import { describe, expect, it } from "vitest";

import { createAdminSession, verifyAdminSession } from "./admin-session";

const SECRET = "dummy-admin-session-secret-32-bytes-long";

describe("관리자 세션", () => {
  it("발급한 관리자 세션을 검증한다", async () => {
    const token = await createAdminSession(SECRET, 3600);
    await expect(verifyAdminSession(token, SECRET)).resolves.toMatchObject({
      role: "admin",
    });
  });

  it("다른 Secret과 만료된 세션을 거부한다", async () => {
    const token = await createAdminSession(SECRET, 3600);
    await expect(
      verifyAdminSession(token, "different-dummy-session-secret-32-bytes"),
    ).rejects.toThrow("ADMIN_REQUIRED");

    const expired = await createAdminSession(SECRET, -1);
    await expect(verifyAdminSession(expired, SECRET)).rejects.toThrow(
      "ADMIN_REQUIRED",
    );
  });

  it("32바이트보다 짧은 Secret을 거부한다", async () => {
    await expect(createAdminSession("short", 3600)).rejects.toThrow(
      "ADMIN_SESSION_SECRET",
    );
  });
});
